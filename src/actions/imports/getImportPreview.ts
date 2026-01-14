'use server';

import { createImportJobService } from '@/lib/services/import-job';
import { importJobRepository } from '@/infrastructure/prisma/repositories/ImportJobRepositoryPrisma';
import { storageService } from '@/lib/services/storage';
import {
  ImportJobError,
  ImportJobNotFoundError,
} from '@/lib/import-job/errors';
import { verifySuperAdminAuth } from '@/actions/users/helpers';

export interface GetImportPreviewResult {
  success: boolean;
  headers?: string[];
  rows?: string[][];
  error?: string;
}

export async function getImportPreview(
  importId: string,
  maxLines?: number
): Promise<GetImportPreviewResult> {
  try {
    await verifySuperAdminAuth();

    const importJobService = createImportJobService({
      importJobRepository,
      storageService,
    });
    const preview = await importJobService.getImportPreview(importId, maxLines);
    return {
      success: true,
      headers: preview.headers,
      rows: preview.rows,
    };
  } catch (err: any) {
    console.error('Error en getImportPreview:', err);
    
    if (err instanceof ImportJobNotFoundError) {
      return {
        success: false,
        error: 'Importación no encontrada',
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
      error: 'Error interno al obtener vista previa',
    };
  }
}

