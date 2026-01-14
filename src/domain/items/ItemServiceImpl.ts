import { ItemService, type CreateItemRequest, type ItemResponse } from './ItemService';
import { ItemCreationRollbackError, ItemInputError, ItemAlreadyExistsError, UserNotVerifiedError } from './errors';
import type { ItemRepository } from './ItemRepository';
import type { UserRepository } from '../users/UserRepository';
import type { EvidenceService } from '../evidence/EvidenceService';
import { requireOrganizationId } from '@/lib/auth/tenant';
import { getCurrentUserWithDetails } from '@/lib/auth/shared/session';
import { revalidatePath } from 'next/cache';

export function createItemServiceImpl(deps: {
  itemRepository: ItemRepository;
  userRepository: UserRepository;
  evidenceService: EvidenceService;
}): ItemService {
  const { itemRepository: itemRepo, userRepository: userRepo, evidenceService: evidence } = deps;

  return {
    async createItem(data: CreateItemRequest): Promise<ItemResponse> {
      try {
        // Get organizationId from context
        const organizationId = await requireOrganizationId();
        
        // 1. Validate policies - check if item already exists
        try {
          const existingItem = await itemRepo.getById(data.customId, organizationId);
          if (existingItem) {
            throw new ItemAlreadyExistsError(
              data.customId,
              `El ID "${data.customId}" ya existe. Por favor, elige un ID diferente.`
            );
          }
        } catch (e) {
          if (e instanceof ItemAlreadyExistsError) throw e;
          // Item doesn't exist, continue
        }

        // 2. Get current user and validate signature
        const currentUser = await getCurrentUserWithDetails();
        
        if (!currentUser?.id) {
          throw new UserNotVerifiedError(
            'current',
            'no_signature',
            'No se pudo obtener el usuario actual'
          );
        }

        const user = await userRepo.getById(currentUser.id);

        if (!user?.signatureID) {
          throw new UserNotVerifiedError(
            user?.id || currentUser.id,
            'no_signature',
            'No se pudo certificar la evidencia: tu usuario no tiene una firma verificada. Completa el KYC en tu perfil.'
          );
        }

        if (user.verificationStatus !== 'VERIFIED') {
          throw new UserNotVerifiedError(
            user.id,
            'not_verified',
            'Tu firma no está verificada. Completa el proceso KYC antes de crear items.'
          );
        }

        const signatureID = user.signatureID!;
        const userId = user.id;

        // 3. Create item in DB with rollback capability
        // Note: categoryIds are passed to create() for the legacy categoryId field
        // The many-to-many relationship is handled separately via addCategoriesToItem
        let created;
        try {
          created = await itemRepo.create({
            id: data.customId,
            organizationId,
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl ?? null,
            itemTemplate: data.itemTemplate ?? [],
            templateFields: data.templateFields ?? null,
            createdByUserId: userId,
            categoryIds: data.categoryIds, // Pass categoryIds for legacy categoryId field
          } as any);
        } catch (e) {
          throw new ItemCreationRollbackError(
            data.customId,
            'db_error',
            `Failed to create item: ${e}`
          );
        }

        // Rollback function
        const rollback = async () => {
          try {
            await itemRepo.delete(created.id, organizationId);
          } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
          }
        };

        try {
          // 3.5. Add categories to item (many-to-many relationship)
          // Items can have multiple categories via ItemCategory table
          if (data.categoryIds && data.categoryIds.length > 0) {
            try {
              await itemRepo.addCategoriesToItem(created.id, data.categoryIds, organizationId);
            } catch (e) {
              await rollback();
              throw new ItemCreationRollbackError(
                created.id,
                'db_error',
                `Failed to add categories to item: ${e}`
              );
            }
          }
          // Note: categoryId (legacy field) is set to first category if provided, but is optional

          // 4. Create evidence with rollback on failure
          let evidenceID: string;
          try {
            evidenceID = await evidence.createItemEvidence({
              signatureID,
              title: 'Creación de Item',
              description: created.description || '',
              imageUrls: created.imageUrl ? [created.imageUrl] : [],
              metadata: {
                type: 'item_creation',
                itemId: created.id,
                categoryIds: data.categoryIds || [],
                name: created.name,
                createdAt: created.createdAt.toISOString(),
                templateFields: created.templateFields,
                itemTemplate: created.itemTemplate,
              },
            });

            // Update item with evidenceID
            try {
              await itemRepo.updateEvidenceId(created.id, organizationId, evidenceID);
            } catch (error) {
              await rollback();
              throw new ItemCreationRollbackError(
                created.id,
                'db_error',
                `Failed to update item with evidence: ${error}`
              );
            }
          } catch (e) {
            await rollback();
            if (e instanceof ItemCreationRollbackError) throw e;
            throw new ItemCreationRollbackError(
              created.id,
              'evidence_failed',
              `Evidence creation failed: ${e}`
            );
          }

          // 5. Revalidate cache
          revalidatePath('/dashboard/items');

          return {
            id: created.id,
            name: created.name,
            description: created.description || '',
            imageUrl: created.imageUrl || undefined,
            itemTemplate: created.itemTemplate,
          } satisfies ItemResponse;
        } catch (e) {
          // If we get here, rollback was already called or item creation failed
          throw e;
        }
      } catch (error) {
        if (error instanceof ItemInputError || 
            error instanceof ItemAlreadyExistsError || 
            error instanceof UserNotVerifiedError || 
            error instanceof ItemCreationRollbackError) {
          throw error;
        }
        throw new ItemCreationRollbackError(
          data.customId,
          'evidence_failed',
          `Unexpected error: ${error}`
        );
      }
    },
  };
}
