'use server';

import { createImportJobService } from '@/lib/services/import-job';
import { importJobRepository } from '@/infrastructure/prisma/repositories/ImportJobRepositoryPrisma';
import { storageService } from '@/lib/services/storage';
import {
  ImportJobError,
  ImportJobNotFoundError,
  ImportJobInvalidStatusError,
} from '@/lib/import-job/errors';
import { verifySuperAdminAuth } from '@/actions/users/helpers';

export interface CancelImportResult {
  success: boolean;
  error?: string;
}

export async function cancelImport(importId: string): Promise<CancelImportResult> {
  try {
    await verifySuperAdminAuth();

    const importJobService = createImportJobService({
      importJobRepository,
      storageService,
    });
    await importJobService.cancelImport(importId);
    return { success: true };
  } catch (err: any) {
    console.error('Error en cancelImport:', err);
    
    if (err instanceof ImportJobNotFoundError) {
      return {
        success: false,
        error: 'Importación no encontrada',
      };
    }

    if (err instanceof ImportJobInvalidStatusError) {
      return {
        success: false,
        error: err.message,
      };
    }

    if (err instanceof ImportJobError) {
      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: false,
      error: 'Error interno al cancelar importación',
    };
  }
}

