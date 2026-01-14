import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario con este token de activación
    const user = await prisma.user.findFirst({
      where: { activationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token de activación inválido o expirado' },
        { status: 404 }
      );
    }

    // Verificar si ya está activado
    if (user.status === 'ACTIVE' && user.password) {
      return NextResponse.json(
        { success: false, error: 'Esta cuenta ya ha sido activada' },
        { status: 400 }
      );
    }

    // Verificar si el token ha expirado (si existe activationExpiresAt)
    if (user.activationExpiresAt && new Date() > user.activationExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'El token de activación ha expirado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Actualizar usuario: establecer contraseña, activar cuenta, limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        status: 'ACTIVE',
        activatedAt: new Date(),
        activationToken: null, // Limpiar el token usado
        activationExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cuenta activada exitosamente',
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





