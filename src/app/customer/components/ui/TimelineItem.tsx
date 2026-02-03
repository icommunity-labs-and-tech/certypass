'use client';
/* eslint-disable @next/next/no-img-element */

import { StateData } from '../../types';
import { TimestampBadge } from './TimestampBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { EvidenceVerification } from '../EvidenceVerification';
import { timelineStyles } from '../../styles/passportStyles';
import GeolocationMap from '@/components/GeolocationMapClient';
import { extractGeolocationField } from '@/lib/template-helpers';

interface TimelineItemProps {
  state: StateData;
}

export function TimelineItem({ state }: TimelineItemProps) {
  return (
    <div style={timelineStyles.item}>
      <div style={timelineStyles.dot} />
      <div style={timelineStyles.card}>
        <TimestampBadge timestamp={state.createdAt} position="absolute" />

        <h5
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingRight: '120px',
          }}
        >
          {state.title}
          {state.evidenceID && <VerifiedBadge title="Estado verificado en blockchain" size="sm" />}
        </h5>

        <p style={{ color: '#64748b', margin: '0 0 0.75rem', lineHeight: '1.5' }}>
          {state.description}
        </p>

        {/* Mapa de geolocalización si existe en templateConfig */}
        {(() => {
          const geolocationField = extractGeolocationField(state.templateConfig);
          if (geolocationField) {
            return (
              <div style={{ marginBottom: '0.75rem' }}>
                <GeolocationMap value={geolocationField} readOnly={true} />
              </div>
            );
          }
          return null;
        })()}

        {state.imageUrls && state.imageUrls.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            {state.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Evidencia ${index + 1}`}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid #e2e8f0',
                }}
              />
            ))}
          </div>
        )}

        {state.evidenceID && (
          <EvidenceVerification
            evidenceId={state.evidenceID}
            type="state"
            entityId={state.id}
            createdAt={state.createdAt}
            createdBy={state.createdBy}
          />
        )}
      </div>
    </div>
  );
}
