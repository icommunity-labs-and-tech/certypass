import { NextRequest, NextResponse } from 'next/server';
import { type ItemResponse } from '@/domain/items/ItemService';
import { createItemServiceImpl } from '@/domain/items/ItemServiceImpl';
import { createEvidenceServiceImpl } from '@/domain/evidence/EvidenceServiceImpl';
import { itemRepository } from '@/infrastructure/prisma/repositories/ItemRepositoryPrisma';
import { userRepository } from '@/infrastructure/prisma/repositories/UserRepositoryPrisma';
import { icommunityService } from '@/infrastructure/icommunity/ICommunityServiceImpl';
import { validateApiToken } from '@/lib/auth/api-tokens/middleware';
import { ItemInputError, ItemAlreadyExistsError, UserNotVerifiedError, ItemCreationRollbackError } from '@/domain/items/errors';
import { parseCursorPaginationParams } from '@/lib/api/cursor-pagination';

/**
 * @swagger
 * /items:
 *   get:
 *     summary: List all items
 *     description: Retrieves a list of all items in the system. Requires a valid API token.
 *     tags:
 *       - Items
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter items by category ID (optional)
 *         example: cat-001
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query to filter items by name or ID (optional)
 *         example: solar
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ID of the last item from previous page)
 *         example: ITEM-001
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of items to return
 *         example: 20
 *     responses:
 *       '200':
 *         description: List of items retrieved successfully (paginated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: ITEM-001
 *                       name:
 *                         type: string
 *                         example: Solar Panel 300W
 *                       description:
 *                         type: string
 *                         example: High efficiency solar panel
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: ID of the last item in this page, use this as cursor for next page
 *                   example: ITEM-020
 *                 hasNextPage:
 *                   type: boolean
 *                   description: Whether there are more items available
 *                   example: true
 *       '401':
 *         description: Unauthorized - invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       '500':
 *         description: Internal server error
 *   post:
 *     summary: Create a new item
 *     description: Creates a new item in the system. Requires a valid API token.
 *     tags:
 *       - Items
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - description
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier for the item
 *                 example: ITEM-001
 *               name:
 *                 type: string
 *                 description: Name of the item
 *                 example: Solar Panel 300W
 *               description:
 *                 type: string
 *                 description: Description of the item
 *                 example: High efficiency solar panel
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs
 *                 example: ["cat-001"]
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL of the item image
 *                 example: https://example.com/image.jpg
 *               templateFields:
 *                 type: object
 *                 description: Additional template fields
 *                 additionalProperties: true
 *               itemTemplate:
 *                 type: array
 *                 description: Item template configuration
 *                 items:
 *                   type: object
 *     responses:
 *       '201':
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 *                   nullable: true
 *                 itemTemplate:
 *                   type: array
 *                   nullable: true
 *       '400':
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       '401':
 *         description: Unauthorized - invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       '409':
 *         description: Conflict - item with this ID already exists
 *       '500':
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API token
    const auth = await validateApiToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const q = searchParams.get('q');
    const paginationParams = parseCursorPaginationParams(searchParams);

    let result;
    if (q) {
      const { searchItemsPaginated } = await import('@/actions/items/searchPaginated');
      result = await searchItemsPaginated(q, paginationParams);
    } else if (categoryId) {
      const { getItemsByCategoryPaginated } = await import('@/actions/items/getByCategoryPaginated');
      result = await getItemsByCategoryPaginated(categoryId, paginationParams);
    } else {
      const { getItemsPaginated } = await import('@/actions/items/listPaginated');
      result = await getItemsPaginated(paginationParams);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API token and get organization context
    const auth = await validateApiToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const { organizationId } = auth;

    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Field "name" is required and must be a non-empty string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Field "description" is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.id || typeof body.id !== 'string' || !body.id.trim()) {
      return NextResponse.json(
        { error: 'Field "id" is required and must be a non-empty string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Build request
    const createRequest = {
      name: body.name.trim(),
      description: body.description.trim(),
      customId: body.id.trim(),
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : undefined,
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
      templateFields: body.templateFields || undefined,
      itemTemplate: body.itemTemplate || undefined,
    };

    // Create services with organizationId from API token
    const evidenceService = createEvidenceServiceImpl({ icommunityService });
    const itemService = createItemServiceImpl({
      itemRepository,
      userRepository,
      evidenceService,
    });

    // Set organizationId context for this API request
    const { setApiOrganizationId } = await import('@/lib/auth/tenant');
    setApiOrganizationId(organizationId);
    
    try {
      const result = await itemService.createItem(createRequest);
      return NextResponse.json(result, { status: 201 });
    } finally {
      // Clear API context after request
      setApiOrganizationId(null);
    }
  } catch (error) {
    // Map domain errors to HTTP responses
    if (error instanceof ItemInputError) {
      return NextResponse.json(
        { error: error.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    if (error instanceof ItemAlreadyExistsError) {
      return NextResponse.json(
        { error: error.message, code: 'ITEM_EXISTS' },
        { status: 409 }
      );
    }
    if (error instanceof UserNotVerifiedError) {
      return NextResponse.json(
        { error: 'User verification required', code: 'USER_NOT_VERIFIED' },
        { status: 403 }
      );
    }
    if (error instanceof ItemCreationRollbackError) {
      return NextResponse.json(
        { error: error.message, code: 'CREATION_FAILED' },
        { status: 500 }
      );
    }

    console.error('Error creating item via API:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

