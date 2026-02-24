'use client';

import Form from 'react-bootstrap/Form';

export type FieldKey = 'id' | 'name' | 'description' | 'allCategories' | 'createdAt' | 'lastStateTitle' | 'lastStateDate' | 'customerUrl';

export interface FieldOption {
  key: FieldKey;
  label: string;
}

interface FieldSelectorProps {
  fields: FieldOption[];
  selected: FieldKey[];
  onToggle: (key: FieldKey) => void;
  idPrefix?: string;
}

export default function FieldSelector({
  fields,
  selected,
  onToggle,
  idPrefix = 'field',
}: FieldSelectorProps) {
  return (
    <div className="row g-2">
      {fields.map(f => (
        <div className="col-12 col-sm-6 col-md-4" key={f.key}>
          <Form.Check
            type="checkbox"
            id={`${idPrefix}-${f.key}`}
            label={f.label}
            checked={selected.includes(f.key)}
            onChange={() => onToggle(f.key)}
          />
        </div>
      ))}
    </div>
  );
}

