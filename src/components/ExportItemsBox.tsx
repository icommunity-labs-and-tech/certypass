'use client'

import Box from '@/components/Box';
import BoxHeader from '@/components/BoxHeader';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import DownloadZipButton from '@/components/DownloadZipButton';
import { exportItemsCsvWithFields, exportItemQRCodes, exportItemsExcel } from '@/actions/exports';
import { uploadCsvForImport } from '@/actions/items/uploadCsvForImport';
import ItemSelectionModal from '@/components/ItemSelectionModal';
import FieldSelector, { type FieldKey } from '@/components/FieldSelector';

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
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importId?: string;
    error?: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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
          El archivo será revisado por el superadministrador antes de ejecutarse. El CSV debe contener al menos las
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

      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Importar productos desde CSV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">
            El CSV debe contener al menos las columnas: <code>id</code>, <code>name</code>,{' '}
            <code>description</code> y <code>categoryName</code>. El archivo será subido y quedará pendiente de
            aprobación por el superadministrador.
          </p>
          <div className="mb-3">
            <Form.Label>Archivo CSV</Form.Label>
            <Form.Control
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0] ?? null;
                setImportFile(file);
                setImportResult(null);
              }}
            />
          </div>

          {importResult && (
            <div className="mt-3">
              {importResult.success ? (
                <div className="alert alert-success">
                  <p className="mb-0">
                    CSV subido correctamente. El archivo quedará pendiente de aprobación por el superadministrador.
                  </p>
                </div>
              ) : (
                <div className="alert alert-danger">
                  <p className="mb-0">
                    {importResult.error || 'Error al subir el archivo CSV'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            disabled={!importFile || isImporting}
            onClick={async () => {
              if (!importFile || isImporting) return;
              try {
                setIsImporting(true);
                const fd = new FormData();
                fd.append('file', importFile);
                const result = await uploadCsvForImport(fd);
                setImportResult({
                  success: result.success,
                  importId: result.importId,
                  error: result.error,
                });
              } finally {
                setIsImporting(false);
              }
            }}
          >
            {isImporting ? 'Subiendo...' : 'Subir CSV'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Box>
  );
}
