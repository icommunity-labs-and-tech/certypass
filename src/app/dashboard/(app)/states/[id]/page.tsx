'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from 'react-bootstrap';
import Box from '@/components/Box';
import BoxTitle from '@/components/BoxTitle';
import LoadingOverlay from '@/components/Loading';
import { Divider } from '@/components/Divider';
import MultipleImageDisplay from '@/components/MultipleImageDisplay';
import { getState } from '@/actions/states';
import { getStatusType } from '@/actions/statusTypes';

export default function StateDetailPage() {
  const { id } = useParams();
  const stateId = id as string;
  const [stateData, setStateData] = useState<any>(null);
  const [statusType, setStatusType] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const st = await getState(stateId);
        setStateData(st);
        if (st?.statusTypeId) {
          try {
            const stType = await getStatusType(st.statusTypeId);
            setStatusType(stType);
          } catch {}
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (stateId) load();
  }, [stateId]);

  if (isLoading) return <LoadingOverlay />;

  if (!stateData) {
    return (
      <Box>
        <BoxTitle message="Estado" />
        <p className="text-danger mb-0">No se encontró información del estado.</p>
      </Box>
    );
  }

  const rawFields = Array.isArray(stateData?.templateConfig?.fields)
    ? (stateData.templateConfig.fields as Array<{ label?: string; name?: string; value?: string }>)
    : [];
  const fieldsWithValue = rawFields.filter(f => typeof f?.value === 'string' && f.value.trim().length > 0);
  const hasDescription = typeof stateData?.description === 'string' && stateData.description.trim().length > 0;
  const imageUrls = Array.isArray(stateData?.imageUrls) ? (stateData.imageUrls as string[]).filter(u => !!u) : [];

  return (
    <>
      <Box>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-flag me-2" />
            <h4 className="mb-0">Estado: {stateData.title || stateId}</h4>
          </div>
        </div>
        <Divider />
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <div>
            <span className="text-muted d-block small">Tipo</span>
            <Badge bg="info">{statusType?.name || '—'}</Badge>
          </div>
          <div>
            <span className="text-muted d-block small">Fecha</span>
            <span>{new Date(stateData.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted d-block small">Respaldado</span>
            <Badge bg={stateData.backed ? 'success' : 'secondary'}>
              {stateData.backed ? 'Sí' : 'No'}
            </Badge>
          </div>
          <div>
            <span className="text-muted d-block small">Evidence ID</span>
            <span>{stateData.evidenceID || '—'}</span>
          </div>
        </div>
      </Box>

      {hasDescription && (
        <Box>
          <h6 className="mb-2">Descripción</h6>
          <Divider />
          <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
            {stateData.description}
          </p>
        </Box>
      )}

      {fieldsWithValue.length > 0 && (
        <Box>
          <h6 className="mb-2">Campos</h6>
          <Divider />
          <div className="row g-3">
            {fieldsWithValue.map((f, idx) => (
              <div key={idx} className="col-12 col-md-6">
                <div className="d-flex justify-content-between border rounded p-2">
                  <span className="text-muted">{f.label || f.name || 'Campo'}</span>
                  <span>{f.value || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      {imageUrls.length > 0 && (
        <Box>
          <h6 className="mb-2">Fotografías</h6>
          <Divider />
          <div className="d-flex align-items-center" style={{ minHeight: '24px' }}>
            <MultipleImageDisplay imageUrls={imageUrls} alt="Estado" className="me-2" style={{ width: '180px' }} maxDisplay={6} />
          </div>
        </Box>
      )}
    </>
  );
}
