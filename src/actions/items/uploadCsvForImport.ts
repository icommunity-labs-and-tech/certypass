'use server';

import { createImportJobService } from '@/lib/services/import-job';
import { importJobRepository } from '@/infrastructure/prisma/repositories/ImportJobRepositoryPrisma';
import { storageService } from '@/lib/services/storage';
import { getCurrentTenant } from '@/lib/auth/tenant';
import {
  ImportJobError,
  InvalidCsvError,
} from '@/lib/import-job/errors';

export interface UploadCsvForImportResult {
  success: boolean;
  importId?: string;
  error?: string;
}

export async function uploadCsvForImport(formData: FormData): Promise<UploadCsvForImportResult> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No se ha enviado ningún archivo' };
    }

    const tenant = await getCurrentTenant();
    if (!tenant.organizationId) {
      throw new ImportJobError('Usuario no tiene organización asignada');
    }

    if (!tenant.userId) {
      throw new ImportJobError('No se pudo obtener el ID del usuario');
    }

    const importJobService = createImportJobService({
      importJobRepository,
      storageService,
    });
    const result = await importJobService.uploadCsvFile(file, tenant.organizationId, tenant.userId);
    return {
      success: true,
      importId: result.id,
    };
  } catch (err: any) {
    console.error('Error en uploadCsvForImport:', err);
    console.error('Error details:', {
      name: err?.name,
      message: err?.message,
      cause: err?.cause,
      stack: err?.stack,
    });
    
    if (err instanceof InvalidCsvError) {
      return {
        success: false,
        error: err.details && err.details.length > 0 
          ? err.details.join(', ') 
          : err.message,
      };
    }

    if (err instanceof ImportJobError) {
      return {
        success: false,
        error: err.message || 'Error al procesar el archivo CSV',
      };
    }

    // Si es un error de Effect, puede estar envuelto
    const errorMessage = err?.message || err?.toString() || 'Error desconocido';
    console.error('Error desconocido:', errorMessage);

    return {
      success: false,
      error: `Error interno al subir archivo CSV: ${errorMessage}`,
    };
  }
}

