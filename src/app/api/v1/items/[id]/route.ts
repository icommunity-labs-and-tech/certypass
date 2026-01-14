import { NextRequest, NextResponse } from 'next/server';
import { withApiTracking } from '@/lib/auth/api-tokens/withApiTracking';
import { getItem } from '@/actions/items';
import { decodeUrlParam } from '@/lib/api/decode-param';

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get an item by ID
 *     description: Retrieves detailed information about a specific item. Requires a valid API token.
 *     tags:
 *       - Items
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the item
 *         example: ITEM-001
 *     responses:
 *       '200':
 *         description: Item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: ITEM-001
 *                 name:
 *                   type: string
 *                   example: Solar Panel 300W
 *                 description:
 *                   type: string
 *                   example: High efficiency solar panel
 *                 imageUrl:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 states:
 *                   type: array
 *                   items:
 *                     type: object
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
 *       '404':
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '500':
 *         description: Internal server error
 */
export const GET = withApiTracking(async (
  request: NextRequest,
  auth,
  params: { id: string }
) => {
  try {
    const id = decodeUrlParam(params.id);
    const item = await getItem(id);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Item no encontrado' },
      { status: 404 }
    );
  }
});

