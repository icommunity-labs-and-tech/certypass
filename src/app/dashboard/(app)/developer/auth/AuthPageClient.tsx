'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Form, Alert, Badge, Table } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createApiToken } from '@/actions/api-tokens/create';
import { listApiTokens } from '@/actions/api-tokens/list';
import { deleteApiToken } from '@/actions/api-tokens/delete';
import { getCallsByToken } from '@/actions/api-calls/getCallsByToken';
import Box from '@/components/Box';
import LoadingOverlay from '@/components/Loading';
import { Divider } from '@/components/Divider';
import '@/components/GenericTable/Toolbar/Toolbar.css';
import { colors, axisProps, gridProps, tooltipStyle } from '@/components/charts/theme';

interface ApiToken {
  id: string;
  name: string;
  organizationId: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export default function AuthPageClient() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiCalls, setApiCalls] = useState<Record<string, Array<{ createdAt: Date; statusCode: number }>>>({});
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenExpiresAt, setNewTokenExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  const loadTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApiTokens();
      if (result.success && result.data) {
        setTokens(result.data);
      } else {
        const errorMsg = result.error || 'Error al cargar tokens';
        console.error('Error loading tokens:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al cargar tokens';
      console.error('Exception loading tokens:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadApiCalls = async () => {
    if (tokens.length === 0) return;
    
    setLoadingCalls(true);
    try {
      const now = new Date();
      const oldestToken = tokens.reduce((oldest, token) => {
        const tokenDate = new Date(token.createdAt);
        return tokenDate < oldest ? tokenDate : oldest;
      }, new Date(tokens[0].createdAt));
      
      const startDate = new Date(oldestToken);
      startDate.setHours(0, 0, 0, 0);
      
      console.log('🔍 loadApiCalls - Cargando llamadas desde:', startDate.toISOString());
      console.log('🔍 loadApiCalls - Tokens a consultar:', tokens.length);
      
      const callsByToken: Record<string, Array<{ createdAt: Date; statusCode: number }>> = {};
      
      for (const token of tokens) {
        const result = await getCallsByToken({
          apiTokenId: token.id,
          startDate,
          endDate: now,
        });
        
        console.log(`🔍 Token "${token.name}" - Success: ${result.success}, Llamadas: ${result.data?.length || 0}`);
        
        if (result.success && result.data) {
          callsByToken[token.id] = result.data.map(call => ({
            createdAt: new Date(call.createdAt),
            statusCode: call.statusCode,
          }));
        } else {
          console.error(`❌ Error para token ${token.name}:`, result.error);
        }
      }
      
      console.log('🔍 loadApiCalls - Total tokens con datos:', Object.keys(callsByToken).length);
      console.log('🔍 loadApiCalls - callsByToken:', Object.entries(callsByToken).map(([id, calls]) => 
        `${id.substring(0, 8)}: ${calls.length} llamadas`
      ));
      
      setApiCalls(callsByToken);
    } catch (err) {
      console.error('Error loading API calls:', err);
    } finally {
      setLoadingCalls(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  useEffect(() => {
    if (tokens.length > 0 && !loading) {
      loadApiCalls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.length, loading]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Si se especifica una fecha, establecer la hora a 00:00 del día indicado
      let expiresAt: Date | null = null;
      if (newTokenExpiresAt) {
        const date = new Date(newTokenExpiresAt);
        date.setHours(0, 0, 0, 0);
        expiresAt = date;
      }
      const result = await createApiToken(newTokenName, expiresAt);

      if (result.success && result.data) {
        setNewToken(result.data.token);
        setShowCreateModal(false);
        setShowTokenModal(true);
        setNewTokenName('');
        setNewTokenExpiresAt('');
        await loadTokens();
      } else {
        setError(result.error || 'Error al crear token');
      }
    } catch (err) {
      setError('Error al crear token');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (tokenId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este token? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await deleteApiToken(tokenId);
      if (result.success) {
        setSuccess('Token eliminado correctamente');
        await loadTokens();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Error al eliminar token');
      }
    } catch (err) {
      setError('Error al eliminar token');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('es-ES');
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Preparar datos para el gráfico de líneas (una línea por token)
  const chartData = useMemo(() => {
    if (tokens.length === 0) return { data: [], tokenNames: [] };

    console.log('📊 chartData - Recalculando gráfico');
    console.log('📊 chartData - apiCalls keys:', Object.keys(apiCalls).map(k => k.substring(0, 8)));
    console.log('📊 chartData - Total llamadas por token:', Object.entries(apiCalls).map(([id, calls]) => 
      `${id.substring(0, 8)}: ${calls.length}`
    ));

    const now = new Date();
    const sortedTokens = [...tokens].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Obtener la fecha más antigua (creación del primer token)
    const oldestDate = new Date(sortedTokens[0].createdAt);
    oldestDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('📊 chartData - Rango de fechas:', oldestDate.toISOString().split('T')[0], 'a', now.toISOString().split('T')[0]);
    console.log('📊 chartData - Días de diferencia:', daysDiff);
    
    // Crear períodos (semanas si hay más de 30 días, días si hay menos)
    const periodType = daysDiff > 30 ? 'week' : 'day';
    const periods: Array<{ period: string; date: Date }> = [];

    // Generar períodos
    const startDate = new Date(oldestDate);
    let periodNum = 1;
    
    while (startDate <= now) {
      const key = periodType === 'week' 
        ? `Sem ${periodNum}`
        : startDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      
      periods.push({ period: key, date: new Date(startDate) });
      
      if (periodType === 'week') {
        startDate.setDate(startDate.getDate() + 7);
        periodNum++;
      } else {
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    // Para cada período, calcular el número de llamadas de cada token
    const result = periods.map(({ period, date }) => {
      const periodData: { period: string; [key: string]: number | string } = { period };
      
      // Calcular la fecha de fin del período
      const endDate = periodType === 'week'
        ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
        : new Date(date.getTime() + 24 * 60 * 60 * 1000);

      sortedTokens.forEach((token, index) => {
        const tokenCreated = new Date(token.createdAt);
        const tokenKey = `token_${index}`;
        
        // Si el token fue creado antes o en este período
        if (tokenCreated <= endDate) {
          // Contar llamadas en este período
          const calls = apiCalls[token.id] || [];
          const callsInPeriod = calls.filter(call => {
            const callDate = new Date(call.createdAt);
            return callDate >= date && callDate < endDate;
          });
          
          periodData[tokenKey] = callsInPeriod.length;
        } else {
          // Token aún no creado en este período
          periodData[tokenKey] = 0;
        }
      });

      return periodData;
    });

    // Obtener nombres de tokens para la leyenda
    const tokenNames = sortedTokens.map((token, index) => ({
      key: `token_${index}`,
      name: token.name
    }));

    return { data: result, tokenNames };
  }, [tokens, apiCalls]);

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Box>
        <h6 className="mb-2">¿Qué son los tokens de API?</h6>
        <Divider />
        <p className="mb-0 text-muted">
          Los tokens de API son credenciales de autenticación que permiten acceder de forma segura a los endpoints REST de la plataforma. 
          Se utilizan como Bearer tokens en el header <code>Authorization</code> de las peticiones HTTP para autenticar y autorizar las llamadas a la API.
          Cada token está asociado a tu organización y puede tener una fecha de expiración opcional.
        </p>
      </Box>

      <Box>
        <div className="table-toolbar">
          <div className="title-section">
            <i className="bi bi-key-fill"></i>
            <h4>Tokens de API</h4>
          </div>
          <div className="controls-section">
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <span className="d-none d-md-inline">Crear Token</span>
              <span className="d-md-none">+</span>
          </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-3">
            {success}
          </Alert>
        )}

        <Divider />

        {tokens.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-key" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
            <p className="mt-3 text-muted">No hay tokens creados aún</p>
          </div>
        ) : (
          <Table responsive striped className="custom-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Creado</th>
                  <th>Último uso</th>
                  <th>Expira</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id}>
                    <td>{token.name}</td>
                    <td>{formatDate(token.createdAt)}</td>
                    <td>{formatDate(token.lastUsedAt)}</td>
                    <td>{token.expiresAt ? formatDate(token.expiresAt) : 'Nunca'}</td>
                    <td>
                      {isExpired(token.expiresAt) ? (
                        <Badge bg="danger">Expirado</Badge>
                      ) : (
                        <Badge bg="success">Activo</Badge>
                      )}
                    </td>
                    <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(token.id)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
          </Table>
        )}
      </Box>

      {tokens.length > 0 && chartData.data.length > 0 && (
        <Box>
          <div className="table-toolbar">
            <div className="title-section">
              <i className="bi bi-graph-up"></i>
              <h4>Evolución del Uso de Tokens</h4>
            </div>
          </div>
          <Divider />
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="period" {...axisProps} />
                <YAxis 
                  {...axisProps} 
                  allowDecimals={false}
                />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => {
                  const tokenIndex = parseInt(name.replace('token_', ''));
                  const tokenName = chartData.tokenNames[tokenIndex]?.name || name;
                  return [`${value} llamada${value !== 1 ? 's' : ''}`, tokenName];
                }}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend 
                formatter={(value) => {
                  const tokenIndex = parseInt(value.replace('token_', ''));
                  return chartData.tokenNames[tokenIndex]?.name || value;
                }}
              />
              {chartData.tokenNames.map((token, index) => {
                const tokenKey = token.key;
                // Generar color único para cada token
                const hue = (index * 137.508) % 360; // Golden angle para distribución de colores
                const color = `hsl(${hue}, 70%, 50%)`;
                
                return (
                  <Line 
                    key={tokenKey}
                    type="monotone" 
                    dataKey={tokenKey}
                    stroke={color}
                    strokeWidth={2}
                    name={tokenKey}
                    dot={{ fill: color, strokeWidth: 2, r: 3 }}
                    connectNulls={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Create Token Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Token</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Token</Form.Label>
              <Form.Control
                type="text"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                required
                placeholder="Ej: Token de producción"
              />
              <Form.Text className="text-muted">
                Elige un nombre descriptivo para identificar este token
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Expiración (opcional)</Form.Label>
              <Form.Control
                type="date"
                value={newTokenExpiresAt}
                onChange={(e) => setNewTokenExpiresAt(e.target.value)}
              />
              <Form.Text className="text-muted">
                Si no se especifica, el token no expirará. La expiración será a las 00:00 del día indicado.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? 'Creando...' : 'Crear Token'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Show New Token Modal */}
      <Modal show={showTokenModal} onHide={() => setShowTokenModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Token Creado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>¡Importante!</strong> Este token solo se mostrará una vez. Asegúrate de copiarlo y guardarlo en un lugar seguro.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Tu Token de API</Form.Label>
            <Form.Control
              type="text"
              value={newToken || ''}
              readOnly
              className="font-monospace"
              style={{ fontSize: '0.9rem' }}
            />
            <Button
              variant="outline-secondary"
              size="sm"
              className="mt-2"
              onClick={() => {
                navigator.clipboard.writeText(newToken || '');
                setSuccess('Token copiado al portapapeles');
              }}
            >
              <i className="bi bi-clipboard me-2"></i>
              Copiar
            </Button>
          </Form.Group>
          <div className="mt-3">
            <h6>Ejemplo de uso:</h6>
            <pre className="bg-light p-3 rounded">
              <code>
                {`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com'}/api/v1/items \\
  -H "Authorization: Bearer ${newToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"id": "ITEM-001", "name": "Mi Item", "description": "Descripción"}'`}
              </code>
            </pre>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowTokenModal(false)}>
            Entendido
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

