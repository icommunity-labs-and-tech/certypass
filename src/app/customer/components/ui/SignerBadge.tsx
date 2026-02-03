'use client';

interface SignerBadgeProps {
  name: string;
}

export function SignerBadge({ name }: SignerBadgeProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        background: 'rgba(219, 234, 254, 0.3)',
        minWidth: 0,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        style={{ color: '#3b82f6', flexShrink: 0 }}
        fill="currentColor"
      >
        <title>Firmante</title>
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          color: '#1e293b',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
        title={name}
      >
        {name}
      </div>
    </div>
  );
}
