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
    title: 'certypass API',
    version: '1.0.0',
    description: 'RESTful API for certypass platform',
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
      name: 'Products',
      description: 'Operations related to products management',
    },
    {
      name: 'States',
      description: 'Operations related to product states',
    },
    {
      name: 'Categories',
      description: 'Operations related to categories management',
    },
    {
      name: 'Events',
      description: 'Operations related to event logs',
    },
    {
      name: 'FraudReports',
      description: 'Operations related to fraud report management',
    },
  ],
  paths: {
    '/products': {
      get: {
        summary: 'List all products',
        description: 'Retrieves a list of all products in the system. Requires a valid API token.',
        operationId: 'listProducts',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: 'categoryId',
                in: 'query',
                schema: { type: 'string' },
                description: 'Filter products by category ID (optional)',
              },
              {
                name: 'q',
                in: 'query',
                schema: { type: 'string' },
                description: 'Search query to filter products by name or ID (optional)',
              },
              {
                name: 'cursor',
                in: 'query',
                schema: { type: 'string' },
                description: 'Cursor for pagination (ID of the last product from previous page)',
                example: 'PROD-001',
              },
              {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                description: 'Maximum number of products to return',
                example: 20,
              },
            ],
            responses: {
              '200': {
                description: 'List of products retrieved successfully (paginated)',
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
                              id: { type: 'string', example: 'PROD-001' },
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
                          description: 'ID of the last product in this page, use this as cursor for next page',
                          example: 'PROD-020',
                        },
                        hasNextPage: {
                          type: 'boolean',
                          description: 'Whether there are more products available',
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
        summary: 'Create a new product',
        description: 'Creates a new product in the system. Requires a valid API token.',
        operationId: 'createProduct',
        tags: ['Products'],
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
                    description: 'Unique identifier for the product',
                    example: 'PROD-001',
                  },
                  name: {
                    type: 'string',
                    description: 'Name of the product',
                    example: 'Solar Panel 300W',
                  },
                  description: {
                    type: 'string',
                    description: 'Description of the product',
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
                    description: 'URL of the product image',
                    example: 'https://example.com/image.jpg',
                  },
                  templateFields: {
                    type: 'object',
                    description: 'Additional template fields',
                    additionalProperties: true,
                  },
                  itemTemplate: {
                    type: 'array',
                    description: 'Product template configuration',
                    items: { type: 'object' },
                  },
                },
              },
              examples: {
                basic: {
                  value: {
                    id: 'PROD-001',
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
            description: 'Product created successfully',
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
                  id: 'PROD-001',
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
            description: 'Conflict - product with this ID already exists',
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
    '/products/{id}': {
      get: {
        summary: 'Get a product by ID',
        description: 'Retrieves detailed information about a specific product. Requires a valid API token.',
        operationId: 'getProductById',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Product ID',
            schema: { type: 'string' },
            example: 'PROD-001',
          },
        ],
        responses: {
          '200': {
            description: 'Product retrieved successfully',
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
            description: 'Product not found',
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
    '/products/{id}/states': {
      post: {
        summary: 'Add a state to a product',
        description: 'Adds a new state to a product. Select a status type from the options — each one defines the exact fields required in `templateConfig`.',
        operationId: 'createProductState',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Product ID',
            schema: { type: 'string' },
            example: 'PROD-001',
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
                    itemId: 'PROD-001',
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
                description: 'Filter states by product ID (optional)',
                example: 'PROD-001',
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
    '/categories/{id}/products/{productId}': {
      post: {
        summary: 'Attach a product to a category',
        description: 'Adds a product to a category. Requires a valid API token.',
        operationId: 'attachProductToCategory',
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
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the product',
            example: 'PROD-001',
          },
        ],
        responses: {
          '200': {
            description: 'Product attached to category successfully',
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
            description: 'Category or product not found',
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
        summary: 'Detach a product from a category',
        description: 'Removes a product from a category. Requires a valid API token.',
        operationId: 'detachProductFromCategory',
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
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique identifier of the product',
            example: 'PROD-001',
          },
        ],
        responses: {
          '200': {
            description: 'Product detached from category successfully',
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
            description: 'Category or product not found',
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
            example: 'product.created',
          },
          {
            name: 'entityType',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter events by entity type (optional)',
            example: 'Product',
          },
          {
            name: 'entityId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter events by entity ID (optional)',
            example: 'PROD-001',
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
    '/fraud-reports': {
      get: {
        summary: 'List fraud reports',
        description: 'Retrieves a list of fraud reports for the organization. Optionally filter by status or product ID. Requires a valid API token.',
        operationId: 'listFraudReports',
        tags: ['FraudReports'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED'] },
            description: 'Filter reports by status (optional)',
            example: 'PENDING',
          },
          {
            name: 'itemId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter reports by product ID (optional)',
            example: 'PROD-001',
          },
        ],
        responses: {
          '200': {
            description: 'List of fraud reports retrieved successfully',
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
                          id: { type: 'string', example: 'clxyz123' },
                          itemId: { type: 'string', example: 'PROD-001' },
                          item: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              imageUrl: { type: 'string', nullable: true },
                            },
                          },
                          status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED'] },
                          acquiredAt: { type: 'string', nullable: true },
                          locationName: { type: 'string', nullable: true },
                          latitude: { type: 'number', nullable: true },
                          longitude: { type: 'number', nullable: true },
                          comments: { type: 'string', nullable: true },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    total: { type: 'integer', example: 12 },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad request - invalid filter value' },
          '401': { description: 'Unauthorized - invalid or missing API token' },
          '500': { description: 'Internal server error' },
        },
      },
      post: {
        summary: 'Create a fraud report',
        description: 'Creates a new fraud report for an item. Requires a valid API token. Typically submitted from the Digital Passport app when a user reports a counterfeit item.',
        operationId: 'createFraudReport',
        tags: ['FraudReports'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['itemId'],
                properties: {
                  itemId: { type: 'string', description: 'ID of the product being reported as fraudulent', example: 'PROD-001' },
                  acquiredAt: { type: 'string', description: 'Date when the product was acquired (optional)', example: '2024-01-15' },
                  latitude: { type: 'number', description: 'Latitude of the reported location (optional)', example: 40.4168 },
                  longitude: { type: 'number', description: 'Longitude of the reported location (optional)', example: -3.7038 },
                  locationName: { type: 'string', description: 'Human-readable name of the location (optional)', example: 'Madrid, España' },
                  comments: { type: 'string', description: 'Additional comments (optional)', example: 'Purchased at a street market' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Fraud report created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    itemId: { type: 'string' },
                    organizationId: { type: 'string' },
                    status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED'], example: 'PENDING' },
                    acquiredAt: { type: 'string', nullable: true },
                    locationName: { type: 'string', nullable: true },
                    latitude: { type: 'number', nullable: true },
                    longitude: { type: 'number', nullable: true },
                    comments: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad request - missing required fields' },
          '401': { description: 'Unauthorized - invalid or missing API token' },
          '500': { description: 'Internal server error' },
        },
      },
    },
    '/fraud-reports/{id}': {
      get: {
        summary: 'Get a fraud report by ID',
        description: 'Retrieves detailed information about a specific fraud report. Requires a valid API token.',
        operationId: 'getFraudReportById',
        tags: ['FraudReports'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Fraud report ID', example: 'clxyz123' },
        ],
        responses: {
          '200': {
            description: 'Fraud report retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    itemId: { type: 'string' },
                    item: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        imageUrl: { type: 'string', nullable: true },
                      },
                    },
                    status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED'] },
                    acquiredAt: { type: 'string', nullable: true },
                    locationName: { type: 'string', nullable: true },
                    latitude: { type: 'number', nullable: true },
                    longitude: { type: 'number', nullable: true },
                    comments: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized - invalid or missing API token' },
          '404': { description: 'Fraud report not found' },
          '500': { description: 'Internal server error' },
        },
      },
      patch: {
        summary: 'Update a fraud report status',
        description: 'Updates the status of a specific fraud report. Requires a valid API token.',
        operationId: 'updateFraudReportStatus',
        tags: ['FraudReports'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Fraud report ID', example: 'clxyz123' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED'], example: 'CONFIRMED' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Fraud report status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    status: { type: 'string', enum: ['PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED'] },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad request - invalid status value' },
          '401': { description: 'Unauthorized - invalid or missing API token' },
          '404': { description: 'Fraud report not found' },
          '500': { description: 'Internal server error' },
        },
      },
      delete: {
        summary: 'Delete a fraud report',
        description: 'Permanently deletes a fraud report. Requires a valid API token.',
        operationId: 'deleteFraudReport',
        tags: ['FraudReports'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Fraud report ID', example: 'clxyz123' },
        ],
        responses: {
          '204': { description: 'Fraud report deleted successfully' },
          '401': { description: 'Unauthorized - invalid or missing API token' },
          '404': { description: 'Fraud report not found' },
          '500': { description: 'Internal server error' },
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

