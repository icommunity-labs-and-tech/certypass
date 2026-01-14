import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-tokens/middleware';
import { attachItemToCategory, detachItemFromCategory } from '@/actions/categories';

/**
 * @swagger
 * /categories/{id}/items/{itemId}:
 *   post:
 *     summary: Attach an item to a category
 *     description: Adds an item to a category. Requires a valid API token.
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the category
 *         example: category-001
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the item
 *         example: ITEM-001
 *     responses:
 *       '200':
 *         description: Item attached to category successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *       '404':
 *         description: Category or item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '500':
 *         description: Internal server error
 *   delete:
 *     summary: Detach an item from a category
 *     description: Removes an item from a category. Requires a valid API token.
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the category
 *         example: category-001
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the item
 *         example: ITEM-001
 *     responses:
 *       '200':
 *         description: Item detached from category successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *       '404':
 *         description: Category or item not found
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Validate API token
    const auth = await validateApiToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const { id: categoryId, itemId } = await params;
    await attachItemToCategory(categoryId, itemId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error attaching item to category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al añadir item a la categoría';
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('no encontrada') || errorMessage.includes('not found') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Validate API token
    const auth = await validateApiToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const { id: categoryId, itemId } = await params;
    await detachItemFromCategory(categoryId, itemId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error detaching item from category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al remover item de la categoría';
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('no encontrada') || errorMessage.includes('not found') ? 404 : 500 }
    );
  }
}

