'use client';

import { Container } from 'react-bootstrap';
import SwaggerUIWrapper from '@/components/SwaggerUIWrapper';

export default function ApiDocsPage() {
  const specUrl = '/api/openapi.json';

  return (
    <Container fluid className="py-4">
      <div style={{ minHeight: '600px' }}>
        <SwaggerUIWrapper url={specUrl} />
      </div>
    </Container>
  );
}
