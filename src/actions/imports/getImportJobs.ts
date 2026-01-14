'use server';

import { createImportJobService } from '@/lib/services/import-job';
import { importJobRepository } from '@/infrastructure/prisma/repositories/ImportJobRepositoryPrisma';
import { storageService } from '@/lib/services/storage';
import { ImportJobError } from '@/lib/import-job/errors';
import { verifySuperAdminAuth } from '@/actions/users/helpers';
import type { ImportFilters } from '@/lib/import-job/types';

export interface GetImportJobsResult {
  success: boolean;
  imports?: Array<{
    id: string;
    organizationId: string;
    organizationName: string | null;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    uploadedBy: string;
    uploadedByName: string | null;
    executedBy: string | null;
    executedByName: string | null;
    rowCount: number | null;
    createdCount: number | null;
    errorDetails: string[] | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  error?: string;
}

export async function getImportJobs(filters?: {
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<GetImportJobsResult> {
  try {
    await verifySuperAdminAuth();

    const importFilters: ImportFilters = filters || {};

    const importJobService = createImportJobService({
      importJobRepository,
      storageService,
    });
    const imports = await importJobService.listImports(importFilters);
    console.log('getImportJobs - imports retrieved:', imports.length, imports);
    return {
      success: true,
      imports: imports.map((imp) => ({
        id: imp.id,
        organizationId: imp.organizationId,
        organizationName: imp.organizationName,
        fileName: imp.fileName,
        fileUrl: imp.fileUrl,
        fileSize: imp.fileSize,
        status: imp.status,
        uploadedBy: imp.uploadedBy,
        uploadedByName: imp.uploadedByName,
        executedBy: imp.executedBy,
        executedByName: imp.executedByName,
        rowCount: imp.rowCount,
        createdCount: imp.createdCount,
        errorDetails: imp.errorDetails,
        startedAt: imp.startedAt,
        completedAt: imp.completedAt,
        createdAt: imp.createdAt,
        updatedAt: imp.updatedAt,
      })),
    };
  } catch (err: any) {
    console.error('Error en getImportJobs:', err);
    console.error('Error details:', {
      name: err?.name,
      message: err?.message,
      cause: err?.cause,
      stack: err?.stack,
    });
    
    if (err instanceof ImportJobError) {
      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: false,
      error: `Error interno al obtener importaciones: ${err?.message || String(err)}`,
    };
  }
}

