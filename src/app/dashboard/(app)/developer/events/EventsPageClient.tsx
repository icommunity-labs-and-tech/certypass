'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Table, Modal, Badge, Form } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { listEvents } from '@/actions/events/list';
import { listEventsByType } from '@/actions/events/listByType';
import Box from '@/components/Box';
import LoadingOverlay from '@/components/Loading';
import { Divider } from '@/components/Divider';
import '@/components/GenericTable/Toolbar/Toolbar.css';
import { colors, axisProps, gridProps, tooltipStyle } from '@/components/charts/theme';

interface EventLog {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  createdAt: Date;
}

export default function EventsPageClient() {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = filterType === 'all' 
        ? await listEvents(100)
        : await listEventsByType(filterType, 100);
      
      if (result.success && result.data) {
        setEvents(result.data);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleViewDetails = (event: EventLog) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-ES');
  };

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType === 'item.created') return 'primary';
    if (eventType === 'state.created') return 'info';
    return 'secondary';
  };

  // Preparar datos para el gráfico de evolución de eventos
  const chartData = useMemo(() => {
    if (events.length === 0) return { data: [], eventTypes: [] };

    const now = new Date();
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Obtener la fecha más antigua
    const oldestDate = new Date(sortedEvents[0].createdAt);
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

    // Obtener tipos de eventos únicos
    const eventTypes = Array.from(new Set(events.map(e => e.eventType)));

    // Contar eventos por tipo y período
    const result = periods.map(({ period, date, endDate }) => {
      const periodData: { period: string; [key: string]: number | string } = { period };

      eventTypes.forEach(eventType => {
        const eventsInPeriod = sortedEvents.filter(event => {
          const eventDate = new Date(event.createdAt);
          return event.eventType === eventType && eventDate >= date && eventDate < endDate;
        });
        
        periodData[eventType] = eventsInPeriod.length;
      });

      return periodData;
    });

    return { data: result, eventTypes };
  }, [events]);

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Box>
        <h6 className="mb-2">¿Qué son los eventos?</h6>
        <Divider />
        <p className="mb-0 text-muted">
          Los eventos son registros automáticos de acciones importantes que ocurren en el sistema, como la creación de items o estados. 
          Estos eventos se utilizan para notificar a sistemas externos mediante webhooks y para mantener un historial de actividad del sistema.
        </p>
      </Box>

      <Box>
        <div className="table-toolbar">
          <div className="title-section">
            <i className="bi bi-calendar-event-fill"></i>
            <h4>Eventos</h4>
          </div>
          <div className="controls-section">
            <Form.Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">Todos</option>
              <option value="item.created">Item Creado</option>
              <option value="state.created">Estado Creado</option>
            </Form.Select>
          </div>
        </div>

        <Divider />

        {events.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-event" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
            <p className="mt-3 text-muted">No hay eventos registrados aún</p>
          </div>
        ) : (
          <Table responsive striped className="custom-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Entidad</th>
                <th>ID de Entidad</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <Badge bg={getEventBadgeVariant(event.eventType)}>
                      {event.eventType}
                    </Badge>
                  </td>
                  <td>{event.entityType}</td>
                  <td>
                    <code>{event.entityId}</code>
                  </td>
                  <td>{formatDate(event.createdAt)}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleViewDetails(event)}
                    >
                      <i className="bi bi-eye me-1"></i>
                      Ver Detalles
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Box>

      {events.length > 0 && chartData.data.length > 0 && (
        <Box>
          <div className="table-toolbar">
            <div className="title-section">
              <i className="bi bi-graph-up"></i>
              <h4>Evolución de Eventos</h4>
            </div>
          </div>
          <Divider />
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} evento${value !== 1 ? 's' : ''}`, '']}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              {chartData.eventTypes.map((eventType, index) => {
                const hue = (index * 137.508) % 360;
                const color = `hsl(${hue}, 70%, 50%)`;
                const variant = getEventBadgeVariant(eventType);
                const lineColor = variant === 'primary' ? colors.blue : variant === 'info' ? colors.sky : colors.amber;
                
                return (
                  <Line 
                    key={eventType}
                    type="monotone" 
                    dataKey={eventType}
                    stroke={lineColor}
                    strokeWidth={2}
                    name={eventType}
                    dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => { setShowDetailsModal(false); setSelectedEvent(null); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Evento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              <div className="mb-3">
                <strong>Tipo de Evento:</strong>
                <div>
                  <Badge bg={getEventBadgeVariant(selectedEvent.eventType)}>
                    {selectedEvent.eventType}
                  </Badge>
                </div>
              </div>
              <div className="mb-3">
                <strong>Tipo de Entidad:</strong>
                <div>{selectedEvent.entityType}</div>
              </div>
              <div className="mb-3">
                <strong>ID de Entidad:</strong>
                <div><code>{selectedEvent.entityId}</code></div>
              </div>
              <div className="mb-3">
                <strong>Fecha:</strong>
                <div>{formatDate(selectedEvent.createdAt)}</div>
              </div>
              <div className="mb-3">
                <strong>Datos:</strong>
                <pre className="bg-light p-3 rounded" style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <code>{JSON.stringify(selectedEvent.data, null, 2)}</code>
                </pre>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDetailsModal(false); setSelectedEvent(null); }}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}


