import React from 'react';

interface DateCellProps {
  value: string | Date | null | undefined;
  format?: 'date' | 'datetime';
  className?: string;
}

export default function DateCell({ value, format = 'date', className = '' }: DateCellProps) {
  if (!value) return <span className="text-muted">-</span>;
  
  const date = new Date(value);
  
  if (format === 'datetime') {
    return (
      <span className={`text-muted ${className}`}>
        {date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    );
  }
  
  return (
    <span className={`text-muted ${className}`}>
      {date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </span>
  );
}
