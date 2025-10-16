/**
 * Standard HTTP Response Utilities
 * Provides consistent response formatting for all Lambda functions
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // TODO: Replace with actual domain in production
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Success response (200-299)
 */
const success = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Created response (201)
 */
const created = (data, resourceId = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (resourceId) {
    response.id = resourceId;
  }
  
  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify(response)
  };
};

/**
 * No content response (204)
 */
const noContent = () => {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: ''
  };
};

/**
 * Bad request error (400)
 */
const badRequest = (message, details = null) => {
  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message,
        details
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Unauthorized error (401)
 */
const unauthorized = (message = 'Authentication required') => {
  return {
    statusCode: 401,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Forbidden error (403)
 */
const forbidden = (message = 'Access denied') => {
  return {
    statusCode: 403,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Not found error (404)
 */
const notFound = (resource = 'Resource') => {
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Conflict error (409)
 */
const conflict = (message, details = null) => {
  return {
    statusCode: 409,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: {
        code: 'CONFLICT',
        message,
        details
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Too many requests error (429)
 */
const tooManyRequests = (message = 'Rate limit exceeded') => {
  return {
    statusCode: 429,
    headers: {
      ...CORS_HEADERS,
      'Retry-After': '60'
    },
    body: JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Internal server error (500)
 */
const internalError = (message = 'Internal server error', error = null) => {
  // Log the actual error for debugging (not exposed to client)
  if (error) {
    console.error('Internal error:', error);
  }
  
  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
        // Only expose error details in development
        ...(process.env.NODE_ENV === 'development' && error ? { details: error.message } : {})
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Service unavailable error (503)
 */
const serviceUnavailable = (message = 'Service temporarily unavailable') => {
  return {
    statusCode: 503,
    headers: {
      ...CORS_HEADERS,
      'Retry-After': '120'
    },
    body: JSON.stringify({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message
      },
      timestamp: new Date().toISOString()
    })
  };
};

/**
 * Handle OPTIONS preflight request
 */
const handleOptions = () => {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: ''
  };
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (body, requiredFields) => {
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }
  
  return { valid: true };
};

/**
 * Parse request body safely
 */
const parseBody = (event) => {
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

/**
 * Extract user ID from Lambda authorizer context
 */
const getUserIdFromEvent = (event) => {
  // API Gateway JWT authorizer puts claims in requestContext.authorizer.claims
  return event.requestContext?.authorizer?.claims?.sub || null;
};

/**
 * Create paginated response
 */
const paginated = (data, { page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  
  return success({
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

module.exports = {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  serviceUnavailable,
  handleOptions,
  validateRequiredFields,
  parseBody,
  getUserIdFromEvent,
  paginated
};
