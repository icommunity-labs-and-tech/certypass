'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { listWebhooks } from '@/actions/webhooks/list';
import { createWebhook } from '@/actions/webhooks/create';
import { updateWebhook } from '@/actions/webhooks/update';
import { deleteWebhook } from '@/actions/webhooks/delete';
import { toggleWebhookActive } from '@/actions/webhooks/toggleActive';
import Box from '@/components/Box';
import LoadingOverlay from '@/components/Loading';
import { Divider } from '@/components/Divider';
import '@/components/GenericTable/Toolbar/Toolbar.css';
import { colors, axisProps, gridProps, tooltipStyle } from '@/components/charts/theme';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  headers: Record<string, string> | null;
  lastTriggeredAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  failureCount: number;
  createdAt: Date;
}

export default function WebhooksPageClient() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    events: [] as string[],
    active: true,
    headers: '',
  });

  const availableEvents = ['item.created', 'state.created'];

  const loadWebhooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listWebhooks();
      if (result.success && result.data) {
        setWebhooks(result.data);
      } else {
        const errorMsg = result.error || 'Error al cargar webhooks';
        console.error('Error loading webhooks:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al cargar webhooks';
      console.error('Exception loading webhooks:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      let headersObj = null;
      if (formData.headers.trim()) {
        try {
          headersObj = JSON.parse(formData.headers);
        } catch {
          setError('Los headers deben ser un JSON válido');
          return;
        }
      }

      const result = await createWebhook({
        name: formData.name,
        url: formData.url,
        secret: formData.secret || null,
        events: formData.events,
        active: formData.active,
        headers: headersObj,
      });

      if (result.success) {
        setSuccess('Webhook creado correctamente');
        setShowCreateModal(false);
        resetForm();
        await loadWebhooks();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Error al crear webhook');
      }
    } catch (err) {
      setError('Error al crear webhook');
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      secret: '',
      events: webhook.events,
      active: webhook.active,
      headers: webhook.headers ? JSON.stringify(webhook.headers, null, 2) : '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebhook) return;

    setError(null);
    setSuccess(null);

    try {
      let headersObj = null;
      if (formData.headers.trim()) {
        try {
          headersObj = JSON.parse(formData.headers);
        } catch {
          setError('Los headers deben ser un JSON válido');
          return;
        }
      }

      const result = await updateWebhook(editingWebhook.id, {
        name: formData.name,
        url: formData.url,
        secret: formData.secret || null,
        events: formData.events,
        active: formData.active,
        headers: headersObj,
      });

      if (result.success) {
        setSuccess('Webhook actualizado correctamente');
        setShowEditModal(false);
        setEditingWebhook(null);
        resetForm();
        await loadWebhooks();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Error al actualizar webhook');
      }
    } catch (err) {
      setError('Error al actualizar webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este webhook? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await deleteWebhook(id);
      if (result.success) {
        setSuccess('Webhook eliminado correctamente');
        await loadWebhooks();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Error al eliminar webhook');
      }
    } catch (err) {
      setError('Error al eliminar webhook');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const result = await toggleWebhookActive(id, !currentActive);
      if (result.success) {
        setSuccess(`Webhook ${!currentActive ? 'activado' : 'desactivado'} correctamente`);
        await loadWebhooks();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Error al actualizar estado del webhook');
      }
    } catch (err) {
      setError('Error al actualizar estado del webhook');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      secret: '',
      events: [],
      active: true,
      headers: '',
    });
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('es-ES');
  };

  // Preparar datos para el gráfico de evolución de triggers de webhooks
  const chartData = useMemo(() => {
    if (webhooks.length === 0) return { data: [], webhookNames: [] };

    const now = new Date();
    const sortedWebhooks = [...webhooks].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Obtener la fecha más antigua
    const oldestDate = new Date(sortedWebhooks[0].createdAt);
    oldestDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Crear períodos (semanas si hay más de 30 días, días si hay menos)
    const periodType = daysDiff > 30 ? 'week' : 'day';
    const periods: Array<{ period: string; date: Date; endDate: Date }> = [];

    const startDate = new Date(oldestDate);
    let periodNum = 1;
    
    while (startDate <= now) {
      const key = periodType === 'week' 
        ? `Sem ${periodNum}`
        : startDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      
      const endDate = periodType === 'week'
        ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      
      periods.push({ period: key, date: new Date(startDate), endDate });
      
      if (periodType === 'week') {
        startDate.setDate(startDate.getDate() + 7);
        periodNum++;
      } else {
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    // Mostrar si cada webhook se disparó en cada período
    const result = periods.map(({ period, date, endDate }) => {
      const periodData: { period: string; [key: string]: number | string } = { period };

      sortedWebhooks.forEach((webhook, index) => {
        const webhookCreated = new Date(webhook.createdAt);
        const webhookKey = `webhook_${index}`;
        
        // Si el webhook fue creado antes o en este período
        if (webhookCreated <= endDate) {
          // Verificar si el webhook se disparó en este período
          if (webhook.lastTriggeredAt) {
            const triggerDate = new Date(webhook.lastTriggeredAt);
            // Si se disparó en este período, mostrar 1, sino 0
            periodData[webhookKey] = (triggerDate >= date && triggerDate < endDate) ? 1 : 0;
          } else {
            // Webhook creado pero nunca disparado
            periodData[webhookKey] = 0;
          }
        } else {
          // Webhook aún no creado en este período
          periodData[webhookKey] = 0;
        }
      });

      return periodData;
    });

    // Obtener nombres de webhooks para la leyenda
    const webhookNames = sortedWebhooks.map((webhook, index) => ({
      key: `webhook_${index}`,
      name: webhook.name
    }));

    return { data: result, webhookNames };
  }, [webhooks]);

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Box>
        <h6 className="mb-2">¿Qué son los webhooks?</h6>
        <Divider />
        <p className="mb-0 text-muted">
          Los webhooks son URLs configuradas que reciben notificaciones automáticas cuando ocurren eventos en el sistema, como la creación de items o estados. 
          Permiten integrar el sistema con servicios externos de forma reactiva, enviando datos en tiempo real cuando ocurren eventos específicos.
        </p>
      </Box>

      <Box>
        <div className="table-toolbar">
          <div className="title-section">
            <i className="bi bi-box-arrow-up-right-fill"></i>
            <h4>Webhooks</h4>
          </div>
          <div className="controls-section">
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <span className="d-none d-md-inline">Crear Webhook</span>
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

        {webhooks.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-box-arrow-up-right" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
            <p className="mt-3 text-muted">No hay webhooks configurados aún</p>
          </div>
        ) : (
          <Table responsive striped className="custom-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>URL</th>
                <th>Eventos</th>
                <th>Estado</th>
                <th>Última ejecución</th>
                <th>Fallos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook) => (
                <tr key={webhook.id}>
                  <td>{webhook.name}</td>
                  <td>
                    <code className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                      {webhook.url}
                    </code>
                  </td>
                  <td>
                    {webhook.events.map(event => (
                      <Badge key={event} bg="secondary" className="me-1">
                        {event}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    {webhook.active ? (
                      <Badge bg="success">Activo</Badge>
                    ) : (
                      <Badge bg="secondary">Inactivo</Badge>
                    )}
                  </td>
                  <td>
                    {webhook.lastTriggeredAt ? (
                      <div>
                        <div>{formatDate(webhook.lastTriggeredAt)}</div>
                        <small className={webhook.lastSuccessAt ? 'text-success' : 'text-danger'}>
                          {webhook.lastSuccessAt ? '✓ Éxito' : '✗ Error'}
                        </small>
                      </div>
                    ) : (
                      'Nunca'
                    )}
                  </td>
                  <td>
                    {webhook.failureCount > 0 ? (
                      <Badge bg="danger">{webhook.failureCount}</Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-1"
                      onClick={() => handleEdit(webhook)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant={webhook.active ? 'outline-warning' : 'outline-success'}
                      size="sm"
                      className="me-1"
                      onClick={() => handleToggleActive(webhook.id, webhook.active)}
                    >
                      <i className={`bi ${webhook.active ? 'bi-pause' : 'bi-play'}`}></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
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

      {webhooks.length > 0 && chartData.data.length > 0 && (
        <Box>
          <div className="table-toolbar">
            <div className="title-section">
              <i className="bi bi-graph-up"></i>
              <h4>Evolución de Triggers</h4>
            </div>
          </div>
          <Divider />
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis 
                {...axisProps} 
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value) => value === 1 ? 'Disparado' : 'No disparado'}
              />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => {
                  const webhookIndex = parseInt(name.replace('webhook_', ''));
                  const webhookName = chartData.webhookNames[webhookIndex]?.name || name;
                  return [value === 1 ? 'Disparado' : 'No disparado', webhookName];
                }}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend 
                formatter={(value) => {
                  const webhookIndex = parseInt(value.replace('webhook_', ''));
                  return chartData.webhookNames[webhookIndex]?.name || value;
                }}
              />
              {chartData.webhookNames.map((webhook, index) => {
                const webhookKey = webhook.key;
                const hue = (index * 137.508) % 360;
                const color = `hsl(${hue}, 70%, 50%)`;
                
                return (
                  <Line 
                    key={webhookKey}
                    type="monotone" 
                    dataKey={webhookKey}
                    stroke={color}
                    strokeWidth={2}
                    name={webhookKey}
                    dot={{ fill: color, strokeWidth: 2, r: 3 }}
                    connectNulls={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => { setShowCreateModal(false); resetForm(); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Webhook</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Ej: Webhook de producción"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                required
                placeholder="https://tu-servidor.com/webhook"
              />
              <Form.Text className="text-muted">
                URL donde se enviarán las notificaciones (debe comenzar con http:// o https://)
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Eventos</Form.Label>
              <div>
                {availableEvents.map(event => (
                  <Form.Check
                    key={event}
                    type="checkbox"
                    id={`create-${event}`}
                    label={event}
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                ))}
              </div>
              <Form.Text className="text-muted">
                Selecciona los eventos a los que se suscribirá este webhook
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Secret (opcional)</Form.Label>
              <Form.Control
                type="text"
                value={formData.secret}
                onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Secreto para verificar las peticiones"
              />
              <Form.Text className="text-muted">
                Se usará para generar la firma HMAC-SHA256 en el header X-Webhook-Signature
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Headers personalizados (JSON opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.headers}
                onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
                placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
              />
              <Form.Text className="text-muted">
                Headers adicionales a incluir en cada petición (formato JSON)
              </Form.Text>
            </Form.Group>
            <Form.Check
              type="switch"
              id="create-active"
              label="Activo"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Crear Webhook
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setEditingWebhook(null); resetForm(); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Webhook</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL</Form.Label>
              <Form.Control
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Eventos</Form.Label>
              <div>
                {availableEvents.map(event => (
                  <Form.Check
                    key={event}
                    type="checkbox"
                    id={`edit-${event}`}
                    label={event}
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Secret (opcional)</Form.Label>
              <Form.Control
                type="text"
                value={formData.secret}
                onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Dejar vacío para no cambiar"
              />
              <Form.Text className="text-muted">
                Dejar vacío para mantener el secret actual
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Headers personalizados (JSON opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.headers}
                onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
              />
            </Form.Group>
            <Form.Check
              type="switch"
              id="edit-active"
              label="Activo"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingWebhook(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Cambios
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

