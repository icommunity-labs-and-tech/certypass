'use server';

import { executeImport } from './executeImport';
import type { ExecuteImportResult } from './executeImport';

export async function retryImport(importId: string): Promise<ExecuteImportResult> {
  // Retry es igual a execute, pero solo funciona para imports con status FAILED
  return executeImport(importId);
}

