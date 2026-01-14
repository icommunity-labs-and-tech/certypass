import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken, ApiTokenAuthResult } from './middleware';
import { trackApiCall } from './trackApiCall';

/**
 * Wrapper for API route handlers that automatically tracks API calls
 * 
 * Usage:
 * ```ts
 * export const GET = withApiTracking(async (request, auth, params) => {
 *   // Your route logic here
 *   return NextResponse.json(data, { status: 200 });
 * });
 * ```
 */
export function withApiTracking<T extends Record<string, any>>(
  handler: (
    request: NextRequest,
    auth: ApiTokenAuthResult,
    params: T
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    // Validate API token first
    const auth = await validateApiToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Get params
    const params = await context.params;
    
    // Get method and path
    const method = request.method;
    const path = new URL(request.url).pathname;

    try {
      // Execute the handler
      const response = await handler(request, auth, params);
      
      // Track the API call (fire and forget)
      trackApiCall({
        apiTokenId: auth.tokenId,
        organizationId: auth.organizationId,
        method,
        path,
        statusCode: response.status,
      }).catch(() => {
        // Silently ignore tracking errors
      });

      return response;
    } catch (error) {
      // Track error responses too
      const statusCode = error instanceof Error && 'status' in error 
        ? (error as any).status 
        : 500;
      
      trackApiCall({
        apiTokenId: auth.tokenId,
        organizationId: auth.organizationId,
        method,
        path,
        statusCode,
      }).catch(() => {
        // Silently ignore tracking errors
      });

      throw error;
    }
  };
}

