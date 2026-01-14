'use server';

import { createImportJobService } from '@/lib/services/import-job';
import { importJobRepository } from '@/infrastructure/prisma/repositories/ImportJobRepositoryPrisma';
import { storageService } from '@/lib/services/storage';
import {
  ImportJobError,
  ImportJobNotFoundError,
  ImportJobInvalidStatusError,
  InvalidCsvError,
} from '@/lib/import-job/errors';
import { verifySuperAdminAuth } from '@/actions/users/helpers';
import { getCurrentTenant } from '@/lib/auth/tenant';
import { prisma } from '@/lib/prisma';

export interface ExecuteImportResult {
  success: boolean;
  createdCount?: number;
  rowCount?: number;
  error?: string;
}

async function createNotification(
  userId: string,
  organizationId: string,
  type: 'SUCCESS' | 'ERROR',
  title: string,
  message: string,
  data?: any
) {
  try {
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        organizationId,
        type,
        title,
        message,
        data: data || null,
        read: false,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // No fallar si la notificaci?n no se puede crear
  }
}

export async function executeImport(importId: string): Promise<ExecuteImportResult> {
  try {
    await verifySuperAdminAuth();

    // Obtener el importJob antes de ejecutar para tener la informaci?n del usuario que lo subi?
    const importJobBefore = await prisma.importJob.findUnique({
      where: { id: importId },
      select: { organizationId: true, uploadedBy: true },
    });

    const tenant = await getCurrentTenant();
    if (!tenant.userId) {
      throw new ImportJobError('No se pudo obtener el ID del usuario');
    }

    const importJobService = createImportJobService({
      importJobRepository,
      storageService,
    });
    const result = await importJobService.executeImport(importId, tenant.userId);
    
    // Crear notificaci?n de ?xito para el usuario que subi? el CSV
    if (importJobBefore) {
      await createNotification(
        importJobBefore.uploadedBy,
        importJobBefore.organizationId,
        'SUCCESS',
        'Importaci?n completada',
        `Se han importado ${result.createdCount} productos correctamente desde el archivo CSV.`,
        { importId, createdCount: result.createdCount }
      );
    }

    return {
      success: true,
      createdCount: result.createdCount,
      rowCount: result.rowCount,
    };
  } catch (err: any) {
    console.error('Error en executeImport:', err);
    
    if (err instanceof InvalidCsvError) {
      return {
        success: false,
        error: err.details && err.details.length > 0 
          ? err.details.join(', ') 
          : err.message,
      };
    }

    if (err instanceof ImportJobNotFoundError) {
      return {
        success: false,
        error: 'Importaci?n no encontrada',
      };
    }

    if (err instanceof ImportJobInvalidStatusError) {
      return {
        success: false,
        error: err.message,
      };
    }

    if (err instanceof ImportJobError) {
      // Crear notificaci?n de error para el usuario que subi? el CSV
      try {
        const importJob = await prisma.importJob.findUnique({
          where: { id: importId },
          select: { organizationId: true, uploadedBy: true, errorDetails: true },
        });
        
        if (importJob) {
          const errorMessage = Array.isArray(importJob.errorDetails) 
            ? importJob.errorDetails.join(', ')
            : err.message;
          
          await createNotification(
            importJob.uploadedBy,
            importJob.organizationId,
            'ERROR',
            'Importaci?n fallida',
            `La importaci?n del archivo CSV ha fallado: ${errorMessage}`,
            { importId, errorDetails: importJob.errorDetails }
          );
        }
      } catch (notifError) {
        console.error('Error creating error notification:', notifError);
      }

      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: false,
      error: 'Error interno al ejecutar importaci?n',
    };
  }
}

