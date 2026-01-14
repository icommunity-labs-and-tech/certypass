import { vi } from 'vitest';

// Mock para hooks personalizados
vi.mock('@/hooks/useAuthSeparated', () => ({
  useAuthSeparated: vi.fn(() => ({
    user: null,
    loading: false,
    isAdmin: false,
    isOperator: false
  }))
}));

vi.mock('@/hooks/useAdminVerificationNotification', () => ({
  useAdminVerificationNotification: vi.fn(() => ({
    showNotification: false,
    message: '',
    dismissNotification: vi.fn()
  }))
}));

vi.mock('@/hooks/useOperatorVerificationNotification', () => ({
  useOperatorVerificationNotification: vi.fn(() => ({
    showNotification: false,
    message: '',
    dismissNotification: vi.fn()
  }))
}));

vi.mock('@/hooks/useVerificationNotification', () => ({
  useVerificationNotification: vi.fn(() => ({
    showNotification: false,
    message: '',
    dismissNotification: vi.fn()
  }))
}));

