import { NextRequest, NextResponse } from 'next/server';
import { createApiTokenServiceImpl } from '@/domain/api-tokens/ApiTokenServiceImpl';
import { apiTokenRepository } from '@/infrastructure/prisma/repositories/ApiTokenRepositoryPrisma';
import { ApiTokenNotFoundError, ApiTokenExpiredError } from '@/domain/api-tokens/ApiTokenService';
import { createHash } from 'crypto';

/**
 * Hash a token to compare with stored hash
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

export interface ApiTokenAuthResult {
  organizationId: string;
  tokenId: string;
}

/**
 * Validate API token from request and return organization context
 */
export async function validateApiToken(request: NextRequest): Promise<ApiTokenAuthResult | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  try {
    const apiTokenService = createApiTokenServiceImpl({ apiTokenRepository });
    const result = await apiTokenService.validateToken(tokenHash);
    return result;
  } catch (error) {
    if (error instanceof ApiTokenNotFoundError || error instanceof ApiTokenExpiredError) {
      return null;
    }
    // Log unexpected errors
    console.error('Unexpected error validating API token:', error);
    return null;
  }
}

/**
 * Middleware helper to check API token authentication
 * Returns null if valid, or NextResponse with error if invalid
 */
export async function requireApiAuth(request: NextRequest): Promise<NextResponse | null> {
  const auth = await validateApiToken(request);
  
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'INVALID_TOKEN' },
      { status: 401 }
    );
  }

  return null; // Auth successful
}


