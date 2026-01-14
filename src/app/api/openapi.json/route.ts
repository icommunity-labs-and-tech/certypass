import { NextResponse } from 'next/server';
import { getSwaggerSpec } from '@/lib/swagger/config';

export async function GET() {
  try {
    // Try to generate spec from JSDoc comments
    const openApiSpec = getSwaggerSpec() as any;
    // Log paths found for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Swagger spec paths found:', Object.keys(openApiSpec.paths || {}));
    }
    return NextResponse.json(openApiSpec);
  } catch (error) {
    console.error('Error generating Swagger spec from JSDoc:', error);
    // Fallback to manual spec if JSDoc parsing fails
    return NextResponse.json(manualOpenApiSpec);
  }
}

// Manual spec as fallback - can be removed once all endpoints are documented with JSDoc
const manualOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CertyPass API',
    version: '1.0.0',
    description: 'RESTful API for CertyPass platform',
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'API Token authentication using Bearer token',
      },
    },
  },
  tags: [
    {
      name: 'Items',
      description: 'Operations related to items management',
    },
    {
      name: 'States',
      description: 'Operations related to item states',
    },
    {
      name: 'Categories',
      description: 'Operations related to categories management',
    },
    {
      name: 'Events',
      description: 'Operations related to event logs',
    },
  ],
  paths: {
    '/items': {
      get: {
        summary: 'List all items',
        description: 'Retrieves a list of all items in the system. Requires a valid API token.',
        operationId: 'listItems',
        tags: ['Items'],
        security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: 'categoryId',
                in: 'query',
                schema: { type: 'string' },
                description: 'Filter items by category ID (optional)',
              },
              {
                name: 'q',
                in: 'query',
                schema: { type: 'string' },
                description: 'Search query to filter items by name or ID (optional)',
              },
              {
                name: 'cursor',
                in: 'query',
                schema: { type: 'string' },
                description: 'Cursor for pagination (ID of the last item from previous page)',
                example: 'ITEM-001',
              },
              {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                description: 'Maximum number of items to return',
                example: 20,
              },
            ],
            responses: {
              '200': {
                description: 'List of items retrieved successfully (paginated)',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', example: 'ITEM-001' },
                              name: { type: 'string', example: 'Solar Panel 300W' },
                              description: { type: 'string', example: 'High efficiency solar panel' },
                              imageUrl: { type: 'string', nullable: true },
                              createdAt: { type: 'string', format: 'date-time' },
                            },
                          },
                        },
                        nextCursor: {
                          type: 'string',
                          nullable: true,
                          description: 'ID of the last item in this page, use this as cursor for next page',
                          example: 'ITEM-020',
                        },
                        hasNextPage: {
                          type: 'boolean',
                          description: 'Whether there are more items available',
                          example: true,
                        },
                      },
                    },
                  },
                },
              },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
          },
        },
      },
      post: {
        summary: 'Create a new item',
        description: 'Creates a new item in the system. Requires a valid API token.',
        operationId: 'createItem',
        tags: ['Items'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'name', 'description'],
                properties: {
                  id: {
                    type: 'string',
                    description: 'Unique identifier for the item',
                    example: 'ITEM-001',
                  },
                  name: {
                    type: 'string',
                    description: 'Name of the item',
                    example: 'Solar Panel 300W',
                  },
                  description: {
                    type: 'string',
                    description: 'Description of the item',
                    example: 'High efficiency solar panel',
                  },
                  categoryIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of category IDs',
                    example: ['cat-001'],
                  },
                  imageUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'URL of the item image',
                    example: 'https://example.com/image.jpg',
                  },
                  templateFields: {
                    type: 'object',
                    description: 'Additional template fields',
                    additionalProperties: true,
                  },
                  itemTemplate: {
                    type: 'array',
                    description: 'Item template configuration',
                    items: { type: 'object' },
                  },
                },
              },
              examples: {
                basic: {
                  value: {
                    id: 'ITEM-001',
                    name: 'Solar Panel 300W',
                    description: 'High efficiency solar panel',
                    categoryIds: ['cat-001'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    imageUrl: { type: 'string', nullable: true },
                    itemTemplate: { type: 'array', nullable: true },
                  },
                },
                example: {
                  id: 'ITEM-001',
                  name: 'Solar Panel 300W',
                  description: 'High efficiency solar panel',
                  imageUrl: null,
                  itemTemplate: [],
                },
              },
            },
          },
          '400': {
            description: 'Bad request - validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                example: {
                  error: 'Field "name" is required and must be a non-empty string',
                  code: 'VALIDATION_ERROR',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                example: {
                  error: 'Unauthorized',
                  code: 'INVALID_TOKEN',
                },
              },
            },
          },
          '409': {
            description: 'Conflict - item with this ID already exists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                example: {
                  error: 'El ID "ITEM-001" ya existe. Por favor, elige un ID diferente.',
                  code: 'ITEM_EXISTS',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                example: {
                  error: 'Internal server error',
                  code: 'INTERNAL_ERROR',
                },
              },
            },
          },
        },
      },
    },
    '/items/{id}': {
      get: {
        summary: 'Get an item by ID',
        description: 'Retrieves detailed information about a specific item. Requires a valid API token.',
        operationId: 'getItemById',
        tags: ['Items'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Item ID',
            schema: { type: 'string' },
            example: 'ITEM-001',
          },
        ],
        responses: {
          '200': {
            description: 'Item retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    imageUrl: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    states: {
                      type: 'array',
                      items: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Item not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/items/{id}/states': {
      post: {
        summary: 'Add a state to an item',
        description: 'Adds a new state to an item. **NOT YET IMPLEMENTED** - This endpoint requires dynamic template validation based on StatusType configuration.',
        operationId: 'createItemState',
        tags: ['Items'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Item ID',
            schema: { type: 'string' },
            example: 'ITEM-001',
          },
        ],
        responses: {
          '501': {
            description: 'Not Implemented',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'object' },
                  },
                },
                example: {
                  error: 'Not Implemented',
                  code: 'NOT_IMPLEMENTED',
                  message: 'State creation API is not yet implemented. This requires dynamic template validation based on StatusType configuration.',
                  details: {
                    itemId: 'ITEM-001',
                    note: 'The templateConfig structure is dynamic and depends on the StatusType.template field.',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/states': {
      get: {
        summary: 'List all states',
        description: 'Retrieves a list of all states in the system. Requires a valid API token.',
        operationId: 'listStates',
        tags: ['States'],
        security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: 'itemId',
                in: 'query',
                schema: { type: 'string' },
                description: 'Filter states by item ID (optional)',
                example: 'ITEM-001',
              },
              {
                name: 'cursor',
                in: 'query',
                schema: { type: 'string' },
                description: 'Cursor for pagination (ID of the last state from previous page)',
                example: 'state-001',
              },
              {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                description: 'Maximum number of states to return',
                example: 20,
              },
            ],
            responses: {
              '200': {
                description: 'List of states retrieved successfully (paginated)',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              title: { type: 'string' },
                              description: { type: 'string' },
                              statusTypeId: { type: 'string' },
                              itemId: { type: 'string' },
                              createdAt: { type: 'string', format: 'date-time' },
                              evidenceID: { type: 'string', nullable: true },
                              backed: { type: 'boolean', nullable: true },
                            },
                          },
                        },
                        nextCursor: {
                          type: 'string',
                          nullable: true,
                          description: 'ID of the last state in this page, use this as cursor for next page',
                          example: 'state-020',
                        },
                        hasNextPage: {
                          type: 'boolean',
                          description: 'Whether there are more states available',
                          example: true,
                        },
                      },
                    },
                  },
                },
              },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/states/{id}': {
      get: {
        summary: 'Get a state by ID',
        description: 'Retrieves detailed information about a specific state. Requires a valid API token.',
        operationId: 'getStateById',
        tags: ['States'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'State ID',
            example: 'state-001',
          },
        ],
        responses: {
          '200': {
            description: 'State retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    statusTypeId: { type: 'string' },
                    itemId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'State not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/categories': {
      get: {
        summary: 'List all categories',
        description: 'Retrieves a list of all categories in the system with pagination. Requires a valid API token.',
        operationId: 'listCategories',
        tags: ['Categories'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'cursor',
            in: 'query',
            schema: { type: 'string' },
            description: 'Cursor for pagination (ID of the last category from previous page)',
            example: 'category-001',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Maximum number of categories to return',
            example: 20,
          },
        ],
        responses: {
          '200': {
            description: 'List of categories retrieved successfully (paginated)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          itemTemplate: { type: 'array' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    nextCursor: {
                      type: 'string',
                      nullable: true,
                      description: 'ID of the last category in this page, use this as cursor for next page',
                      example: 'category-020',
                    },
                    hasNextPage: {
                      type: 'boolean',
                      description: 'Whether there are more categories available',
                      example: true,
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/categories/{id}': {
      get: {
        summary: 'Get a category by ID',
        description: 'Retrieves detailed information about a specific category. Requires a valid API token.',
        operationId: 'getCategoryById',
        tags: ['Categories'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the category',
            example: 'category-001',
          },
        ],
        responses: {
          '200': {
            description: 'Category retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    itemTemplate: { type: 'array' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Category not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/categories/{id}/items/{itemId}': {
      post: {
        summary: 'Attach an item to a category',
        description: 'Adds an item to a category. Requires a valid API token.',
        operationId: 'attachItemToCategory',
        tags: ['Categories'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the category',
            example: 'category-001',
          },
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the item',
            example: 'ITEM-001',
          },
        ],
        responses: {
          '200': {
            description: 'Item attached to category successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Category or item not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
      delete: {
        summary: 'Detach an item from a category',
        description: 'Removes an item from a category. Requires a valid API token.',
        operationId: 'detachItemFromCategory',
        tags: ['Categories'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the category',
            example: 'category-001',
          },
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the item',
            example: 'ITEM-001',
          },
        ],
        responses: {
          '200': {
            description: 'Item detached from category successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Category or item not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/events': {
      get: {
        summary: 'List all events',
        description: 'Retrieves a list of all events in the system with pagination. Requires a valid API token.',
        operationId: 'listEvents',
        tags: ['Events'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'cursor',
            in: 'query',
            schema: { type: 'string' },
            description: 'Cursor for pagination (ID of the last event from previous page)',
            example: 'event-001',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Maximum number of events to return',
            example: 20,
          },
          {
            name: 'eventType',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter events by event type (optional)',
            example: 'item.created',
          },
          {
            name: 'entityType',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter events by entity type (optional)',
            example: 'Item',
          },
          {
            name: 'entityId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter events by entity ID (optional)',
            example: 'ITEM-001',
          },
        ],
        responses: {
          '200': {
            description: 'List of events retrieved successfully (paginated)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          organizationId: { type: 'string' },
                          eventType: { type: 'string' },
                          entityType: { type: 'string' },
                          entityId: { type: 'string' },
                          data: { type: 'object' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    nextCursor: {
                      type: 'string',
                      nullable: true,
                      description: 'ID of the last event in this page, use this as cursor for next page',
                      example: 'event-020',
                    },
                    hasNextPage: {
                      type: 'boolean',
                      description: 'Whether there are more events available',
                      example: true,
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/events/{id}': {
      get: {
        summary: 'Get an event by ID',
        description: 'Retrieves detailed information about a specific event. Requires a valid API token.',
        operationId: 'getEventById',
        tags: ['Events'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the event',
            example: 'event-001',
          },
        ],
        responses: {
          '200': {
            description: 'Event retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    organizationId: { type: 'string' },
                    eventType: { type: 'string' },
                    entityType: { type: 'string' },
                    entityId: { type: 'string' },
                    data: { type: 'object' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Event not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
  },
};

