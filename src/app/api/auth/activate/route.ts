import { NextRequest, NextResponse } from 'next/server';
import { activateAccount } from '@/actions/organizations/activate-account';

export async function POST(request: NextRequest) {
  try {
    const { token, password, skipKycCheck } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Usar la acción de activación que incluye validación de KYC
    const result = await activateAccount({
      activationToken: token,
      password,
      skipKycCheck: skipKycCheck === true,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta activada exitosamente',
      user: result.user,
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





