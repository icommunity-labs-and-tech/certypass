'use server';

import { createUserServiceImpl } from '@/domain/users/UserServiceImpl';
import { userRepository } from '@/infrastructure/prisma/repositories/UserRepositoryPrisma';
import { icommunityService } from '@/infrastructure/icommunity/ICommunityServiceImpl';
import { verifyUserAuth } from './helpers';
import { KycUrlGenerationError, UserNotFoundError } from '@/domain/users/errors';

/**
 * Devuelve una URL de KYC válida para el usuario dado. Si no existe,
 * intenta generarla on-demand para compatibilidad retroactiva.
 */
export async function getOrCreateKycUrl(userId?: string): Promise<{ success: boolean; kycURL?: string; error?: string; }> {
  try {
    const payload = await verifyUserAuth();
    const targetUserId = userId ?? payload.id;
    
    console.log('[getOrCreateKycUrl] Payload:', { 
      authUserId: payload.id, 
      authUserRole: payload.role,
      authUserOrgId: payload.organizationId,
      targetUserId 
    });

    const userService = createUserServiceImpl({
      userRepository,
      icommunityService,
    });
    const { kycURL } = await userService.getOrCreateKycUrl(targetUserId);
    
    console.log('[getOrCreateKycUrl] Success:', kycURL);
    return { success: true, kycURL };
  } catch (error) {
    console.error('[getOrCreateKycUrl] Error:', error);
    if (error instanceof KycUrlGenerationError || error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
