'use server';

import { revalidatePath } from 'next/cache';
import { createUserServiceImpl } from '@/domain/users/UserServiceImpl';
import { userRepository } from '@/infrastructure/prisma/repositories/UserRepositoryPrisma';
import { icommunityService } from '@/infrastructure/icommunity/ICommunityServiceImpl';
import { AuthorizationError, UserAlreadyExistsError, UserInputError, UserNotFoundError } from '@/domain/users/errors';

export async function updateUser(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as 'USER' | 'ADMIN';
    const phone = (formData.get('phone') as string) || null;
    const notes = (formData.get('notes') as string) || null;
    const verificationStatus = formData.get('verificationStatus') as any;
    const signatureID = (formData.get('signatureID') as string) || null;
    const kycURL = (formData.get('kycURL') as string) || null;

    const userService = createUserServiceImpl({
      userRepository,
      icommunityService,
    });
    const { user } = await userService.updateUser({ id, name, email, role, phone, notes, verificationStatus, signatureID, kycURL });

    revalidatePath('/dashboard/users');

    return {
      success: true,
      user
    };
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof UserAlreadyExistsError || error instanceof UserInputError || error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
