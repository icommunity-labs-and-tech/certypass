'use client'

import Box from '@/components/Box';
import BoxHeader from '@/components/BoxHeader';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import DownloadZipButton from '@/components/DownloadZipButton';
import { exportItemsCsvWithFields, exportItemQRCodes, exportItemsExcel } from '@/actions/exports';
import { validateCsv, type ValidationResult } from '@/actions/items/validateCsv';
import { executeCsvImport } from '@/actions/items/executeCsvImport';
import ItemSelectionModal from '@/components/ItemSelectionModal';
import FieldSelector, { type FieldKey } from '@/components/FieldSelector';
import { MAX_CSV_FILE_SIZE, MAX_CSV_ROWS, formatMaxFileSize } from '@/actions/items/csvImportLimits';

const AVAILABLE_FIELDS = [
  { key: 'id' as FieldKey, label: 'ID' },
  { key: 'name' as FieldKey, label: 'Nombre' },
  { key: 'description' as FieldKey, label: 'Descripción' },
  { key: 'categoryName' as FieldKey, label: 'Categoría' },
  { key: 'createdAt' as FieldKey, label: 'Fecha de creación' },
  { key: 'lastStateTitle' as FieldKey, label: 'Pasaporte: Último estado' },
  { key: 'lastStateBacked' as FieldKey, label: 'Pasaporte: Último estado respaldado' },
  { key: 'customerUrl' as FieldKey, label: 'URL pública' },
  { key: 'passportJson' as FieldKey, label: 'Pasaporte digital completo (JSON)' },
];

export default function ExportItemsBox() {
  const [selectedFields, setSelectedFields] = useState<FieldKey[]>(['id', 'name', 'categoryName']);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    createdCount?: number;
    errors?: string[];
  } | null>(null);

  const toggleField = (key: FieldKey) => {
    setSelectedFields(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const getCsvFile = async (selectedItemIds: string[], items: any[]) => {
    const ids = selectedItemIds.length ? selectedItemIds : items.map((it: any) => it.id);
    return exportItemsCsvWithFields(selectedFields, ids);
  };

  const getQrZip = async (selectedItemIds: string[], items: any[]) => {
    const ids = selectedItemIds.length ? selectedItemIds : items.map((it: any) => it.id);
    return exportItemQRCodes({ itemIds: ids });
  };

  const getExcelFile = async (selectedItemIds: string[], items: any[]) => {
    const ids = selectedItemIds.length ? selectedItemIds : items.map((it: any) => it.id);
    return exportItemsExcel({ itemIds: ids });
  };

  return (
    <Box>
      <BoxHeader title="Exportar/Importar productos" icon="bi-filetype-csv" />

      <Form className="mb-3 px-1">
        <h6 className="mb-1">Exportar productos a CSV</h6>
        <p className="text-muted small mb-2">
          Usa el botón <strong>Exportar CSV</strong> para seleccionar productos y campos a exportar. Este CSV puede
          usarse tanto para análisis como para preparar futuras importaciones. El CSV de ejemplo para importación
          suele usar al menos <code>id</code>, <code>name</code>, <code>description</code> y{' '}
          <code>categoryName</code>.
        </p>
        <Button
          variant="outline-primary"
          className="d-flex align-items-center"
          onClick={() => setShowCsvModal(true)}
        >
          <i className="bi bi-filetype-csv me-2" />
          Exportar CSV
        </Button>

        <hr className="my-4" />

        <h6 className="mb-1">Exportar QRs de productos</h6>
        <p className="text-muted small mb-2">
          Usa el botón <strong>Exportar QRs</strong> para seleccionar un conjunto de productos y descargar los códigos QR
          en formato ZIP (imágenes PNG) o Excel (.xlsx con QR incrustado). Ideal para imprimir pegatinas, etiquetas
          físicas o inventarios impresos.
        </p>
        <Button
          variant="outline-primary"
          className="d-flex align-items-center"
          onClick={() => setShowQrModal(true)}
        >
          <i className="bi bi-qr-code me-2" />
          Exportar QRs
        </Button>

        <hr className="my-4" />

        <h6 className="mb-1">Importar productos desde CSV</h6>
        <p className="text-muted small mb-2">
          El botón <strong>Importar productos desde CSV</strong> permite subir un archivo CSV para importar productos.
          Primero se validará el archivo y luego podrás ejecutar la importación si todo está correcto. El CSV debe contener al menos las
          columnas: <code>id</code>, <code>name</code>, <code>description</code> y <code>categoryName</code>.
        </p>
        <Button
          variant="outline-secondary"
          className="d-flex align-items-center"
          onClick={() => setShowImportModal(true)}
        >
          <i className="bi bi-filetype-csv me-2" />
          Importar items desde CSV
        </Button>
      </Form>

      <ItemSelectionModal
        show={showCsvModal}
        onHide={() => setShowCsvModal(false)}
        title="Seleccionar productos y campos para exportar CSV"
        footer={(selectedItemIds, items) => (
          <>
            <Button variant="secondary" onClick={() => setShowCsvModal(false)}>
              Cancelar
            </Button>
            <DownloadZipButton
              label="Exportar CSV"
              iconClassName="bi bi-filetype-csv me-2"
              variant="primary"
              getZip={() => getCsvFile(selectedItemIds, items)}
            />
          </>
        )}
      >
        <h6 className="mb-2">Seleccionar campos</h6>
        <p className="text-muted small mb-3">
          Selecciona los campos que quieres incluir en el CSV.
        </p>
        <FieldSelector
          fields={AVAILABLE_FIELDS}
          selected={selectedFields}
          onToggle={toggleField}
          idPrefix="csv-field"
        />
        <hr className="my-3" />
        <h6 className="mb-2">Seleccionar productos</h6>
      </ItemSelectionModal>

      <ItemSelectionModal
        show={showQrModal}
        onHide={() => setShowQrModal(false)}
        title="Seleccionar productos para exportar QRs"
        footer={(selectedItemIds, items) => (
          <>
            <Button variant="secondary" onClick={() => setShowQrModal(false)}>
              Cancelar
            </Button>
            <DownloadZipButton
              label="Exportar como ZIP"
              iconClassName="bi bi-file-zip me-2"
              variant="primary"
              getZip={() => getQrZip(selectedItemIds, items)}
            />
            <DownloadZipButton
              label="Exportar como Excel"
              iconClassName="bi bi-file-earmark-spreadsheet me-2"
              variant="success"
              getZip={() => getExcelFile(selectedItemIds, items)}
            />
          </>
        )}
      />

      <Modal show={showImportModal} onHide={() => {
        setShowImportModal(false);
        setImportFile(null);
        setValidationResult(null);
        setExecutionResult(null);
      }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Importar productos desde CSV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info mb-3">
            <h6 className="alert-heading">
              <i className="bi bi-info-circle me-2" />
              Límites de importación
            </h6>
            <ul className="mb-0 small">
              <li>Tamaño máximo del archivo: <strong>{formatMaxFileSize()}</strong></li>
              <li>Número máximo de filas: <strong>{MAX_CSV_ROWS}</strong></li>
              <li>Si tu archivo excede estos límites, divídelo en lotes más pequeños</li>
            </ul>
          </div>
          
          <p className="text-muted small mb-3">
            El CSV debe contener al menos las columnas: <code>id</code>, <code>name</code>,{' '}
            <code>description</code> y <code>categoryName</code>. El archivo se validará automáticamente al seleccionarlo.
          </p>
          
          <div className="mb-3">
            <Form.Label>Archivo CSV</Form.Label>
            <Form.Control
              type="file"
              accept=".csv,text/csv"
              disabled={isValidating || isExecuting}
              onChange={async (e) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0] ?? null;
                setImportFile(file);
                setValidationResult(null);
                setExecutionResult(null);
                
                if (file) {
                  setIsValidating(true);
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const result = await validateCsv(fd);
                    if (result.success && result.result) {
                      setValidationResult(result.result);
                    } else {
                      // Si hay un error de autenticación o contexto, mostrarlo de forma especial
                      const errorMessage = result.error || 'Error al validar el archivo CSV';
                      setValidationResult({
                        valid: false,
                        errors: [{
                          line: 0,
                          type: 'invalid_type',
                          message: errorMessage,
                        }],
                        summary: {
                          totalRows: 0,
                          validRows: 0,
                          errorCount: 1,
                        },
                      });
                    }
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al validar';
                    setValidationResult({
                      valid: false,
                      errors: [{
                        line: 0,
                        type: 'invalid_type',
                        message: errorMessage,
                      }],
                      summary: {
                        totalRows: 0,
                        validRows: 0,
                        errorCount: 1,
                      },
                    });
                  } finally {
                    setIsValidating(false);
                  }
                }
              }}
            />
          </div>

          {isValidating && (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Validando CSV...</span>
              </div>
              <p className="mt-2 text-muted">Validando archivo CSV...</p>
            </div>
          )}

          {validationResult && !isValidating && (
            <div className="mt-3">
              {validationResult.valid ? (
                <div>
                  <div className="alert alert-success">
                    <h6 className="alert-heading">
                      <i className="bi bi-check-circle me-2" />
                      Validación exitosa
                    </h6>
                    <p className="mb-0">
                      El archivo CSV ha sido validado correctamente. Puedes proceder con la importación.
                    </p>
                  </div>
                  
                  {validationResult.categoriesToCreate && validationResult.categoriesToCreate.length > 0 && (
                    <div className="alert alert-info mb-3">
                      <h6 className="alert-heading">
                        <i className="bi bi-info-circle me-2" />
                        Categorías a crear automáticamente
                      </h6>
                      <p className="mb-2">
                        Las siguientes categorías no existen en el sistema y se crearán automáticamente durante la importación:
                      </p>
                      <ul className="mb-0">
                        {validationResult.categoriesToCreate.map((catName, idx) => (
                          <li key={idx}><strong>{catName}</strong></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {validationResult.summary && (
                    <div className="mb-3">
                      <h6>Resumen:</h6>
                      <ul className="mb-0">
                        <li>Total de filas: <strong>{validationResult.summary.totalRows}</strong></li>
                        <li>Filas válidas: <strong>{validationResult.summary.validRows}</strong></li>
                        {validationResult.categoriesToCreate && validationResult.categoriesToCreate.length > 0 && (
                          <li>Categorías a crear: <strong>{validationResult.categoriesToCreate.length}</strong></li>
                        )}
                      </ul>
                    </div>
                  )}

                  {validationResult.preview && (
                    <div className="mb-3">
                      <h6>Vista previa (primeras filas):</h6>
                      <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table className="table table-sm table-bordered">
                          <thead className="table-light sticky-top">
                            <tr>
                              {validationResult.preview.headers.map((header, idx) => (
                                <th key={idx}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {validationResult.preview.sampleRows.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="alert alert-danger">
                    <h6 className="alert-heading">
                      <i className="bi bi-exclamation-triangle me-2" />
                      Errores de validación encontrados
                    </h6>
                    <p className="mb-0">
                      Se encontraron {validationResult.summary?.errorCount || validationResult.errors?.length || 0} error(es) en el archivo CSV. 
                      Por favor corrige los errores antes de continuar.
                    </p>
                  </div>

                  {validationResult.summary && (
                    <div className="mb-3">
                      <h6>Resumen:</h6>
                      <ul className="mb-0">
                        <li>Total de filas: <strong>{validationResult.summary.totalRows}</strong></li>
                        <li>Filas válidas: <strong>{validationResult.summary.validRows}</strong></li>
                        <li>Errores encontrados: <strong className="text-danger">{validationResult.summary.errorCount}</strong></li>
                      </ul>
                    </div>
                  )}

                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <div className="mb-3">
                      <h6>Detalles de errores:</h6>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '80px' }}>Línea</th>
                              <th style={{ width: '120px' }}>Columna</th>
                              <th style={{ width: '150px' }}>Tipo</th>
                              <th>Mensaje</th>
                              <th style={{ width: '150px' }}>Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validationResult.errors.map((error, idx) => (
                              <tr key={idx}>
                                <td>{error.line || '-'}</td>
                                <td>{error.column || '-'}</td>
                                <td>
                                  <span className="badge bg-danger">
                                    {error.type === 'missing_column' && 'Columna faltante'}
                                    {error.type === 'invalid_type' && 'Tipo inválido'}
                                    {error.type === 'empty_required' && 'Campo vacío'}
                                    {error.type === 'duplicate_id' && 'ID duplicado'}
                                    {error.type === 'category_not_found' && 'Categoría no existe'}
                                    {error.type === 'id_exists' && 'ID ya existe'}
                                    {error.type === 'invalid_url' && 'URL inválida'}
                                    {!['missing_column', 'invalid_type', 'empty_required', 'duplicate_id', 'category_not_found', 'id_exists', 'invalid_url'].includes(error.type) && error.type}
                                  </span>
                                </td>
                                <td>{error.message}</td>
                                <td className="text-truncate" style={{ maxWidth: '150px' }} title={error.value}>
                                  {error.value || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {executionResult && (
            <div className="mt-3">
              {executionResult.success ? (
                <div className="alert alert-success">
                  <h6 className="alert-heading">
                    <i className="bi bi-check-circle me-2" />
                    Importación completada
                  </h6>
                  <p className="mb-0">
                    Se han importado <strong>{executionResult.createdCount || 0}</strong> producto(s) correctamente.
                  </p>
                </div>
              ) : (
                <div className="alert alert-danger">
                  <h6 className="alert-heading">
                    <i className="bi bi-exclamation-triangle me-2" />
                    Error en la importación
                  </h6>
                  {executionResult.errors && executionResult.errors.length > 0 ? (
                    <ul className="mb-0">
                      {executionResult.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-0">Error desconocido al ejecutar la importación</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowImportModal(false);
              setImportFile(null);
              setValidationResult(null);
              setExecutionResult(null);
            }}
            disabled={isExecuting}
          >
            Cerrar
          </Button>
          {validationResult?.valid && !executionResult && (
            <Button
              variant="success"
              disabled={!importFile || isExecuting || isValidating}
              onClick={async () => {
                if (!importFile || isExecuting) return;
                setIsExecuting(true);
                setExecutionResult(null);
                try {
                  const fd = new FormData();
                  fd.append('file', importFile);
                  const result = await executeCsvImport(fd);
                  setExecutionResult(result);
                } catch (error) {
                  setExecutionResult({
                    success: false,
                    errors: [error instanceof Error ? error.message : 'Error desconocido'],
                  });
                } finally {
                  setIsExecuting(false);
                }
              }}
            >
              {isExecuting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Ejecutando importación...
                </>
              ) : (
                <>
                  <i className="bi bi-play-fill me-2" />
                  Ejecutar importación
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Box>
  );
}
