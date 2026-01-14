'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Badge, Form, Modal } from 'react-bootstrap';
import { 
  getImportJobs, 
  executeImport, 
  cancelImport, 
  retryImport, 
  getImportPreview,
  type GetImportJobsResult,
  type GetImportPreviewResult
} from '@/actions/imports';

type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface ImportJob {
  id: string;
  organizationId: string;
  organizationName: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: ImportStatus;
  uploadedBy: string;
  uploadedByName: string | null;
  executedBy: string | null;
  executedByName: string | null;
  rowCount: number | null;
  createdCount: number | null;
  errorDetails: string[] | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ImportJobsManager() {
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ImportStatus | 'ALL'>('ALL');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<GetImportPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  const loadImports = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }
      const result = await getImportJobs(filters);
      console.log('getImportJobs result:', result);
      if (result.success && result.imports) {
        console.log('Setting imports:', result.imports);
        setImports(result.imports);
      } else {
        console.error('getImportJobs failed:', result.error);
        // Mostrar error al usuario
        if (result.error) {
          alert(`Error al cargar importaciones: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error loading imports:', error);
      alert(`Error al cargar importaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImports();
  }, [statusFilter]);

  const handleExecute = async (importId: string) => {
    try {
      const result = await executeImport(importId);
      if (result.success) {
        await loadImports();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing import:', error);
      alert('Error al ejecutar importación');
    }
  };

  const handleCancel = async (importId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta importación?')) return;
    try {
      const result = await cancelImport(importId);
      if (result.success) {
        await loadImports();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error canceling import:', error);
      alert('Error al cancelar importación');
    }
  };

  const handleRetry = async (importId: string) => {
    try {
      const result = await retryImport(importId);
      if (result.success) {
        await loadImports();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error retrying import:', error);
      alert('Error al reintentar importación');
    }
  };

  const handlePreview = async (importId: string) => {
    setSelectedImportId(importId);
    setPreviewLoading(true);
    setShowPreviewModal(true);
    try {
      const result = await getImportPreview(importId, 20);
      setPreviewData(result);
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewData({ success: false, error: 'Error al cargar vista previa' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const getStatusBadge = (status: ImportStatus) => {
    const variants: Record<ImportStatus, string> = {
      PENDING: 'warning',
      PROCESSING: 'info',
      COMPLETED: 'success',
      FAILED: 'danger',
      CANCELLED: 'secondary',
    };
    const labels: Record<ImportStatus, string> = {
      PENDING: 'Pendiente',
      PROCESSING: 'Procesando',
      COMPLETED: 'Completado',
      FAILED: 'Fallido',
      CANCELLED: 'Cancelado',
    };
    return <Badge bg={variants[status]}>{labels[status]}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-ES');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Gestión de Importaciones CSV</h4>
        <Form.Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ImportStatus | 'ALL')}
          style={{ width: 'auto' }}
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="PROCESSING">Procesando</option>
          <option value="COMPLETED">Completado</option>
          <option value="FAILED">Fallido</option>
          <option value="CANCELLED">Cancelado</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : imports.length === 0 ? (
        <div className="text-center py-5 text-muted">
          No hay importaciones para mostrar
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Organización</th>
              <th>Estado</th>
              <th>Filas</th>
              <th>Creados</th>
              <th>Subido por</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((imp) => (
              <tr key={imp.id}>
                <td>{imp.fileName}</td>
                <td>{imp.organizationName || imp.organizationId}</td>
                <td>{getStatusBadge(imp.status)}</td>
                <td>{imp.rowCount ?? '-'}</td>
                <td>{imp.createdCount ?? '-'}</td>
                <td>{imp.uploadedByName || imp.uploadedBy}</td>
                <td>{formatDate(imp.createdAt)}</td>
                <td>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handlePreview(imp.id)}
                      title="Ver vista previa del CSV"
                    >
                      <i className="bi bi-eye me-1" />
                      Vista previa
                    </Button>
                    {imp.status === 'PENDING' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleExecute(imp.id)}
                          title="Ejecutar importación"
                        >
                          <i className="bi bi-play-fill me-1" />
                          Ejecutar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(imp.id)}
                          title="Cancelar importación"
                        >
                          <i className="bi bi-x-circle me-1" />
                          Cancelar
                        </Button>
                      </>
                    )}
                    {imp.status === 'FAILED' && (
                      <>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleRetry(imp.id)}
                          title="Reintentar importación"
                        >
                          <i className="bi bi-arrow-clockwise me-1" />
                          Reintentar
                        </Button>
                        {imp.errorDetails && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              alert(imp.errorDetails?.join('\n') || 'Sin detalles de error');
                            }}
                            title="Ver errores"
                          >
                            <i className="bi bi-exclamation-triangle me-1" />
                            Errores
                          </Button>
                        )}
                      </>
                    )}
                    {imp.status === 'PROCESSING' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(imp.id)}
                        title="Cancelar importación"
                      >
                        <i className="bi bi-x-circle me-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Vista previa del CSV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : previewData?.success ? (
            <div>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    {previewData.headers?.map((header, idx) => (
                      <th key={idx}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows?.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="alert alert-danger">
              {previewData?.error || 'Error al cargar vista previa'}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

