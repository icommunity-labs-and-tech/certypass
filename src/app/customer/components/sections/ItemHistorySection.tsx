'use client';

import { StateData } from '../../types';
import { TimelineItem } from '../ui/TimelineItem';
import { timelineStyles } from '../../styles/passportStyles';

interface ItemHistorySectionProps {
  states: StateData[] | undefined;
}

export function ItemHistorySection({ states }: ItemHistorySectionProps) {
  const hasHistory = states && states.length > 0;

  if (!hasHistory) {
    return (
      <div style={timelineStyles.emptyState}>
        <div style={timelineStyles.emptyIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '2rem', height: '2rem' }}>
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p style={{ fontSize: '1rem', margin: '0', lineHeight: '1.5' }}>
          No hay historial disponible para este producto
        </p>
      </div>
    );
  }

  return (
    <div style={timelineStyles.container}>
      <div style={timelineStyles.line} />
      {states.map((state) => (
        <TimelineItem key={state.id} state={state} />
      ))}
    </div>
  );
}
