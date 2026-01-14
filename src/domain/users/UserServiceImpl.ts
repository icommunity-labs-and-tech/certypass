import { UserService, type CreateUserRequest, type UpdateUserRequest, type ChangePasswordRequest, type UserResponse, type VerificationResponse } from './UserService';
import { UserInputError, UserAlreadyExistsError, UserNotFoundError, AuthorizationError, InvalidCredentialsError, PasswordValidationError, KycUrlGenerationError } from './errors';
import type { ICommunityService } from '@/infrastructure/icommunity/ICommunityService';
import { ICommunityConfigError, ICommunityHTTPError } from '@/infrastructure/icommunity/errors';
import type { UserRepository } from './UserRepository';
import { DbError } from './UserRepository';
import { requireOrganizationId } from '@/lib/auth/tenant';
import { verifyAdminAuth, verifyUserAuth, generateTemporaryPassword } from '@/actions/users/helpers';
import bcrypt from 'bcryptjs';

const toUserResponse = (u: any): UserResponse => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  phone: u.phone ?? null,
  notes: u.notes ?? null,
  verificationStatus: u.verificationStatus,
  signatureID: u.signatureID ?? null,
  kycURL: u.kycURL ?? null,
});

export function createUserServiceImpl(deps: {
  userRepository: UserRepository;
  icommunityService: ICommunityService;
}): UserService {
  const { userRepository: userRepo, icommunityService: icommunity } = deps;

  return {
    async createUser(data: CreateUserRequest): Promise<{ user: UserResponse; temporaryPassword: string }> {
      try {
        const organizationId = await requireOrganizationId();
        
        // auth
        await verifyAdminAuth();

        if (!data.email || !data.name) {
          throw new UserInputError(!data.email ? 'email' : 'name', 'Email y nombre son obligatorios');
        }

        // Check if email exists
        try {
          await userRepo.getByEmail(data.email);
          throw new UserAlreadyExistsError(data.email, 'Ya existe un usuario con este email');
        } catch (e) {
          if (e instanceof UserAlreadyExistsError) throw e;
          // User doesn't exist, continue
        }

        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        const created = await userRepo.create({
          organizationId,
          email: data.email,
          name: data.name,
          role: data.role,
          phone: data.phone ?? null,
          notes: data.notes ?? null,
          passwordHash: hashedPassword,
        });

        return { user: toUserResponse(created), temporaryPassword };
      } catch (e) {
        if (e instanceof UserInputError || e instanceof UserAlreadyExistsError || e instanceof AuthorizationError) throw e;
        if (e instanceof DbError) throw new UserInputError('email', 'Error creando usuario');
        throw e;
      }
    },

    async updateUser(data: UpdateUserRequest): Promise<{ user: UserResponse }> {
      try {
        const organizationId = await requireOrganizationId();
        
        await verifyAdminAuth();

        if (!data.id) {
          throw new UserInputError('email', 'ID requerido');
        }

        if (data.email) {
          // Best-effort: check if another user has the same email
          try {
            const existing = await userRepo.getByEmail(data.email);
            if (existing.id !== data.id) {
              throw new UserAlreadyExistsError(data.email, 'Ya existe otro usuario con este email');
            }
          } catch (e) {
            if (e instanceof UserAlreadyExistsError) throw e;
            // User doesn't exist or other error, continue
          }
        }

        const updated = await userRepo.update(data.id, organizationId, {
          name: data.name ?? null,
          email: data.email ?? null,
          role: data.role ?? null,
          phone: data.phone ?? null,
          notes: data.notes ?? null,
          verificationStatus: (data.verificationStatus as any) ?? null,
          signatureID: data.signatureID ?? null,
          kycURL: data.kycURL ?? null,
        });

        return { user: toUserResponse(updated) };
      } catch (e) {
        if (e instanceof UserInputError || e instanceof UserAlreadyExistsError || e instanceof UserNotFoundError || e instanceof AuthorizationError) throw e;
        if (e instanceof DbError) throw new UserNotFoundError(data.id, 'Usuario no encontrado');
        throw e;
      }
    },

    async deleteUser(id: string): Promise<void> {
      try {
        const organizationId = await requireOrganizationId();
        
        await verifyAdminAuth();

        await userRepo.delete(id, organizationId);
      } catch (e) {
        if (e instanceof AuthorizationError) throw e;
        if (e instanceof DbError) throw new UserNotFoundError(id, 'Usuario no encontrado');
        throw e;
      }
    },

    async changePassword(data: ChangePasswordRequest): Promise<void> {
      try {
        const payload = await verifyUserAuth();

        if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
          throw new PasswordValidationError('Todos los campos son obligatorios');
        }
        if (data.newPassword !== data.confirmPassword) {
          throw new PasswordValidationError('Las contraseñas nuevas no coinciden');
        }
        if (data.newPassword.length < 6) {
          throw new PasswordValidationError('La nueva contraseña debe tener al menos 6 caracteres');
        }

        const passwordHash = await userRepo.getPasswordHash(payload.id);
        const isCurrent = await bcrypt.compare(data.currentPassword, passwordHash);
        if (!isCurrent) {
          throw new InvalidCredentialsError('La contraseña actual es incorrecta');
        }
        
        const isSame = await bcrypt.compare(data.newPassword, passwordHash);
        if (isSame) {
          throw new PasswordValidationError('La nueva contraseña debe ser diferente a la actual');
        }

        const hashed = await bcrypt.hash(data.newPassword, 10);
        const userOrgId = payload.organizationId ?? null;
        await userRepo.update(payload.id, userOrgId!, { passwordHash: hashed });
      } catch (e) {
        if (e instanceof InvalidCredentialsError || e instanceof PasswordValidationError || e instanceof UserNotFoundError) throw e;
        if (e instanceof DbError) throw new UserNotFoundError(data.userId, 'Usuario no encontrado');
        throw e;
      }
    },

    async getOrCreateKycUrl(userId: string): Promise<{ kycURL: string }> {
      try {
        console.log('[UserService.getOrCreateKycUrl] Start for userId:', userId);
        const user = await userRepo.getById(userId);

        console.log('[UserService.getOrCreateKycUrl] User found:', {
          id: user.id,
          organizationId: user.organizationId,
          hasKycURL: !!user.kycURL,
          hasSignatureID: !!user.signatureID
        });

        if (user.kycURL) {
          console.log('[UserService.getOrCreateKycUrl] Returning existing KYC URL');
          return { kycURL: user.kycURL };
        }

        const userOrgId = user.organizationId ?? null;
        console.log('[UserService.getOrCreateKycUrl] userOrgId:', userOrgId);
        
        // retry existing signature
        if (user.signatureID) {
          console.log('[UserService.getOrCreateKycUrl] Retrying existing signature:', user.signatureID);
          const r = await icommunity.retrySignature(user.signatureID!);
          if (r.url) {
            console.log('[UserService.getOrCreateKycUrl] Got retry URL, updating user');
            await userRepo.update(user.id, userOrgId!, { kycURL: r.url, verificationStatus: 'WAITING' as any });
            return { kycURL: r.url };
          }
        }

        // create new signature
        console.log('[UserService.getOrCreateKycUrl] Creating new signature for:', user.name);
        const res = await icommunity.createSignature(user.name || 'Firma');
        console.log('[UserService.getOrCreateKycUrl] Signature created:', { url: res.url, signatureId: res.signature_id });
        const url = res.url ?? '';
        if (!url) {
          throw new KycUrlGenerationError(userId, 'No se pudo crear firma KYC');
        }
        console.log('[UserService.getOrCreateKycUrl] Updating user with new signature');
        await userRepo.update(user.id, userOrgId!, { kycURL: url, verificationStatus: 'WAITING' as any, signatureID: res.signature_id ?? null });
        console.log('[UserService.getOrCreateKycUrl] Success, returning URL');
        return { kycURL: url };
      } catch (e) {
        console.error('[UserService.getOrCreateKycUrl] Final error:', e);
        if (e instanceof UserNotFoundError || e instanceof KycUrlGenerationError || e instanceof ICommunityConfigError || e instanceof ICommunityHTTPError) throw e;
        if (e instanceof DbError) throw new KycUrlGenerationError(userId, 'No se pudo guardar la URL de KYC');
        throw e;
      }
    },

    async retryVerification(userId: string): Promise<VerificationResponse> {
      try {
        const ensured = await userRepo.getById(userId);
        if (!ensured.signatureID) {
          throw new KycUrlGenerationError(userId, 'Usuario sin firma para reintentar verificación');
        }
        const sig = ensured.signatureID!;

        const r = await icommunity.retrySignature(sig);
        const response: VerificationResponse = { verificationStatus: r.url ? 'WAITING' : 'NOT_VERIFIED', kycURL: r.url };
        return response;
      } catch (e) {
        if (e instanceof UserNotFoundError || e instanceof KycUrlGenerationError || e instanceof ICommunityConfigError || e instanceof ICommunityHTTPError) throw e;
        if (e instanceof DbError) throw new UserNotFoundError(userId, 'Usuario no encontrado');
        throw e;
      }
    },
  };
}
