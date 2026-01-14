export default function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function formatCompactDate(date: Date | string): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return String(date); // Return original value as string if invalid date
  }

  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('es-ES', { month: 'long' });
  const hour = dateObj.getHours().toString().padStart(2, '0');
  const minute = dateObj.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} a las ${hour}:${minute}`;
}

export function formatValueWithSmartDateDetection(value: unknown, fieldName?: string): string {
  // Check if this is a date field (by name or content)
  const isDateField = fieldName && (
    fieldName.toLowerCase().includes('date') || 
    fieldName.toLowerCase().includes('created') || 
    fieldName.toLowerCase().includes('updated')
  );
  
  const isDateContent = typeof value === 'string' && value.includes('GMT');
  
  if (isDateField || isDateContent) {
    return formatCompactDate(value as Date | string);
  }
  
  return formatValue(value);
}

export function truncateText(text: string, maxLength: number = 12): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 1) + '…';
}
