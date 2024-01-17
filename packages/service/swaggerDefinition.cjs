module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'API Documentation',
    description: 'Bottom Time application backend APIs.',
    version: '1.0.0',
    contact: {
      name: 'Chris Carleton',
      url: 'https://bottomti.me/',
      email: 'mrchriscarleton@gmail.com',
    },
  },
  security: {
    bearerAuth: [],
    cookieAuth: [],
  },
  servers: [
    {
      url: 'http://localhost:4800',
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Admin',
      description: 'Restricted endpoints accessible only to administrators.',
    },
    {
      name: 'Auth',
      description: 'Endpoints used for authentication or authorization.',
    },
    {
      name: 'Certifications',
      description:
        'Endpoints pertaining to the management of dive certifications.',
    },
    {
      name: 'Dive Logs',
      description: 'Endpoints pertaining to the management of dive logs.',
    },
    {
      name: 'Dive Sites',
      description: 'Endpoints pertaining to the management of dive sites.',
    },
    {
      name: 'Friends',
      description:
        'Endpoints pertaining to the management of friends and friend requests.',
    },
    {
      name: 'Users',
      description:
        'Endpoints pertaining to the management of user accounts or profiles.',
    },
    {
      name: 'Tanks',
      description:
        'Endpoints pertaining to the management of dive tank profiles.',
    },
  ],

  components: {
    parameters: {
      SortOrder: {
        name: 'sortOrder',
        in: 'query',
        description: 'The sort order for the results.',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
        },
      },

      Skip: {
        name: 'skip',
        in: 'query',
        description: 'The number of results to skip.',
        schema: {
          type: 'integer',
          minimum: 0,
        },
      },

      Limit: {
        name: 'limit',
        in: 'query',
        description: 'The maximum number of results to return.',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
      },
    },

    responses: {
      SuccessResponse: {
        description: 'Represents a standardized success/fail response.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Success',
            },
          },
        },
      },
      ErrorResponse: {
        description: 'Represents a standardized error response.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },

    schemas: {
      Success: {
        type: 'object',
        required: ['success'],
        properties: {
          success: {
            title: 'Success',
            type: 'boolean',
            description: 'Indicates whether the request was successful.',
          },
          reason: {
            title: 'Reason',
            type: 'string',
            description:
              'A human-readable message describing the reason for the success or failure.',
          },
        },
      },
      Error: {
        type: 'object',
        required: ['message', 'method', 'path', 'status'],
        properties: {
          details: {
            title: 'Error Details',
            type: 'object',
            description:
              'Additional error details. (Structure will be dependent on the type of error.)',
          },
          message: {
            title: 'Error Message',
            type: 'string',
            description: 'A human-readable error message.',
          },
          method: {
            title: 'HTTP Method',
            type: 'string',
            description: 'The HTTP method used for the request.',
            example: 'GET',
          },
          path: {
            title: 'Request Path',
            type: 'string',
            description: 'The request path.',
            example: '/api/users',
          },
          status: {
            title: 'HTTP Status Code',
            type: 'integer',
            description: 'The HTTP status code associated with the error.',
          },
          user: {
            title: 'User Info',
            type: 'object',
            description:
              'Information on the user that invoked the request (if authenticated).',
            required: ['id', 'username'],
            properties: {
              id: {
                title: 'User ID',
                type: 'string',
                description: "The user's unique identifier.",
              },
              username: {
                title: 'Username',
                type: 'string',
                description: "The user's username.",
              },
            },
          },
          stack: {
            title: 'Error Stack Trace',
            type: 'string',
            description:
              'The error stack trace. Will only be present in non-production environments to aid in troubleshooting.',
          },
        },
      },
    },

    securitySchemes: {
      bearerAuth: {
        type: 'http',
        description:
          'A JWT-formatted bearer token in the authorization header.',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      cookieAuth: {
        type: 'apiKey',
        description: 'A JWT-formatted authorization token in a session cookie.',
        in: 'cookie',
        name: 'bottomtime',
      },
    },
  },
};
