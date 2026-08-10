import { IsbeService, type IsbeTimestampResult, type IsbeHashStatus } from './IsbeService';
import { IsbeConfigError, IsbeHTTPError } from './errors';

const BASE_URL = 'https://api.icommunitylabs.com';

function getAuthHeaders(): HeadersInit {
  const token = process.env.IBS_TOKEN;
  if (!token) {
    throw new IsbeConfigError('IBS_TOKEN is not configured');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function getApplicationId(): string {
  const id = process.env.IBS_ISBE_APPLICATION_ID;
  if (!id) {
    throw new IsbeConfigError('IBS_ISBE_APPLICATION_ID is not configured');
  }
  return id;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), ...getAuthHeaders() },
  });

  const parse = async () => {
    try {
      return (await res.json()) as T;
    } catch {
      return undefined as unknown as T;
    }
  };

  if (!res.ok) {
    const body = await parse();
    throw new IsbeHTTPError(
      'timestampHash', // Overridden per method
      `ISBE API error ${res.status} ${res.statusText}: ${JSON.stringify(body)}`,
      res.status,
      body
    );
  }

  return (await parse()) as T;
}

async function requestWithRetry<T>(
  operation: 'timestampHash' | 'getHashStatus',
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff: 200ms, 400ms, 800ms
      const delay = Math.pow(2, attempt) * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Re-throw with proper error type
  if (lastError instanceof IsbeConfigError || lastError instanceof IsbeHTTPError) {
    throw lastError;
  }

  throw new IsbeHTTPError(
    operation,
    `Unexpected error: ${lastError?.message || String(lastError)}`
  );
}

export function createIsbeService(): IsbeService {
  return {
    async timestampHash(hash: string): Promise<IsbeTimestampResult> {
      return requestWithRetry('timestampHash', async () => {
        try {
          const result = await request<{ execution_id: number; tx_hash: string; status: string }>(
            `/applications/${getApplicationId()}/isbe/hashtimestamp`,
            { method: 'POST', body: JSON.stringify({ hash }) }
          );
          return { executionId: result.execution_id, txHash: result.tx_hash, status: result.status };
        } catch (error) {
          if (error instanceof IsbeConfigError) throw error;
          if (error instanceof IsbeHTTPError) {
            throw new IsbeHTTPError('timestampHash', error.message, error.status, error.response);
          }
          throw new IsbeHTTPError('timestampHash', `Unexpected error: ${error}`);
        }
      });
    },

    async getHashStatus(hash: string): Promise<IsbeHashStatus> {
      return requestWithRetry('getHashStatus', async () => {
        try {
          const result = await request<{ hash: string; exists: boolean; timestamp?: number }>(
            `/applications/${getApplicationId()}/isbe/hashtimestamp/${hash}`,
            { method: 'GET' }
          );
          return { exists: result.exists, timestamp: result.timestamp ?? null };
        } catch (error) {
          if (error instanceof IsbeConfigError) throw error;
          if (error instanceof IsbeHTTPError) {
            throw new IsbeHTTPError('getHashStatus', error.message, error.status, error.response);
          }
          throw new IsbeHTTPError('getHashStatus', `Unexpected error: ${error}`);
        }
      });
    },
  };
}

export const isbeService = createIsbeService();
