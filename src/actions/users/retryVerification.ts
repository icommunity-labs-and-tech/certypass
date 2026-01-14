'use server';

import { createUserServiceImpl } from '@/domain/users/UserServiceImpl';
import { userRepository } from '@/infrastructure/prisma/repositories/UserRepositoryPrisma';
import { icommunityService } from '@/infrastructure/icommunity/ICommunityServiceImpl';
import { verifyUserAuth } from './helpers';
import { KycUrlGenerationError, UserNotFoundError } from '@/domain/users/errors';

export async function retryVerification() {
  try {
    const payload = await verifyUserAuth();

    const userService = createUserServiceImpl({
      userRepository,
      icommunityService,
    });
    const res = await userService.retryVerification(payload.id);
    
    return { success: true, ...res };
  } catch (error) {
    if (error instanceof KycUrlGenerationError || error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
