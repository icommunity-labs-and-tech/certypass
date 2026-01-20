'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { userRepository } from '@/infrastructure/prisma/repositories/UserRepositoryPrisma';

export async function login({ email, password }: { email: string; password: string }) {
  try {
    const user = await userRepository.getByEmail(email);
    // We need the password hash; use getPasswordHash by id
    const hash = await userRepository.getPasswordHash(user.id);
    const ok = await bcrypt.compare(password, hash ?? '');
    if (!ok) {
      throw new Error('Credenciales inválidas');
    }
    return { message: 'Logged in successfully' };
  } catch {
    throw new Error('Credenciales inválidas');
  }
}

export async function signup({ email, password }: { email: string; password: string }) {
  try {
    // Check existence best-effort
    try {
      await userRepository.getByEmail(email);
      throw new Error('El usuario ya existe');
    } catch {
      // User doesn't exist, continue
    }
    
    const hashed = await bcrypt.hash(password, 10);
    await userRepository.create({ 
      email, 
      name: email, 
      role: 'USER', 
      passwordHash: hashed,
      organizationId: '', // This will need to be handled properly
      phone: null,
      notes: null,
    });
    return { message: 'Usuario creado correctamente' };
  } catch (error) {
    if (error instanceof Error && error.message === 'El usuario ya existe') {
      throw error;
    }
    throw new Error('Error al crear usuario');
  }
}

export async function logout() {
  redirect('/dashboard/login');
}


