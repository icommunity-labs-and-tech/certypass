import React from 'react';
import { StatusBadgeCell, DateCell, TextTruncateCell } from './GenericTable/Cells';

export interface FieldSchema {
  key: string;
  label: string;
  format?: 'text' | 'date' | 'datetime' | 'status' | 'number' | 'relation' | 'custom';
  maxLength?: number;
  relationData?: any[];
  relationKey?: string;
  relationDisplay?: string;
  customRender?: (value: any, data: any) => React.ReactNode;
  hidden?: boolean;
}

interface KeyValueListProps {
  data: Record<string, any>;
  schema: FieldSchema[];
  title?: string;
  className?: string;
  showEmptyFields?: boolean;
}

export default function KeyValueList({ 
  data, 
  schema, 
  title, 
  className = '', 
  showEmptyFields = false 
}: KeyValueListProps) {
  const visibleFields = schema.filter(field => !field.hidden);
  
  const renderValue = (field: FieldSchema, value: any) => {
    if (field.customRender) {
      return field.customRender(value, data);
    }
    
    switch (field.format) {
      case 'status':
        return <StatusBadgeCell value={value} />;
        
      case 'date':
        return <DateCell value={value} format="date" />;
        
      case 'datetime':
        return <DateCell value={value} format="datetime" />;
        
      case 'number':
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('es-ES');
        
      case 'relation':
        if (!field.relationData || !field.relationKey || !field.relationDisplay) return value || '-';
        const relatedItem = field.relationData.find(item => item[field.relationKey!] === value);
        return relatedItem ? (
          <span className="text-info">{relatedItem[field.relationDisplay!]}</span>
        ) : (value || '-');
        
      case 'text':
      default:
        return <TextTruncateCell value={value} maxLength={field.maxLength || 60} />;
    }
  };
  
  return (
    <div className={`key-value-list ${className}`}>
      {title && <h5 className="mb-3">{title}</h5>}
      
      {visibleFields.map(field => {
        const value = data[field.key];
        
        // Ocultar campos vacíos si no se solicitan
        if (!showEmptyFields && (value === null || value === undefined || value === '')) {
          return null;
        }
        
        return (
          <div key={field.key} className="mb-3">
            <strong className="text-muted d-block mb-1">{field.label}:</strong>
            <div className="ps-2">
              {renderValue(field, value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
