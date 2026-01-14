import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VerificationBanner from '../VerificationBanner';
import { useAuthSeparated } from '@/hooks/useAuthSeparated';

// Mock the hook
const mockUseAuthSeparated = vi.mocked(useAuthSeparated);

describe('VerificationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when loading is true', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: null,
      loading: true,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.queryByText(/Para certificar evidencias/)).not.toBeInTheDocument();
  });

  it('should not render when user is null', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: null,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.queryByText(/Para certificar evidencias/)).not.toBeInTheDocument();
  });

  it('should not render when user is verified with signatureID', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'VERIFIED',
        signatureID: 'sig-123'
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.queryByText(/Para certificar evidencias/)).not.toBeInTheDocument();
  });

  it('should render NOT_VERIFIED message', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'NOT_VERIFIED',
        signatureID: null
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.getByText(/Para certificar evidencias automáticamente, necesitas verificar tu identidad/)).toBeInTheDocument();
  });

  it('should render VERIFIED without signatureID message', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'VERIFIED',
        signatureID: null
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.getByText(/Tu identidad está verificada pero necesitas una signature ID/)).toBeInTheDocument();
  });

  it('should render WAITING message', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'WAITING',
        signatureID: null
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.getByText(/Tu verificación de identidad está en proceso/)).toBeInTheDocument();
  });

  it('should render REJECTED message', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'REJECTED',
        signatureID: null
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.getByText(/Tu verificación de identidad fue rechazada/)).toBeInTheDocument();
  });

  it('should render action button when showActionButton is true', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'NOT_VERIFIED',
        signatureID: null
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner showActionButton={true} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render action button by default', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'NOT_VERIFIED',
        signatureID: null
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    render(<VerificationBanner />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render with correct variant styling', () => {
    mockUseAuthSeparated.mockReturnValue({
      user: {
        id: '1',
        verificationStatus: 'NOT_VERIFIED',
        signatureID: null
      } as any,
      loading: false,
      isAdmin: false,
      isOperator: false
    });

    const { container } = render(<VerificationBanner variant="danger" />);
    const alert = container.querySelector('.alert');
    expect(alert).toHaveClass('alert-danger');
  });
});
