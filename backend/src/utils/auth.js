const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Verify that the user is an admin
 * 
 * @param {Object} event - API Gateway event with JWT claims
 * @returns {Promise<Object>} User object if admin, throws error otherwise
 */
async function verifyAdmin(event) {
  try {
    // Get user ID from JWT claims (set by API Gateway authorizer)
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    
    if (!userId) {
      throw new Error('Unauthorized: No user ID in token');
    }

    console.log('Verifying admin access for user:', userId);

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Unauthorized: User not found');
    }

    if (!profile) {
      throw new Error('Unauthorized: User profile not found');
    }

    // Check if user has admin role
    if (profile.role !== 'admin') {
      console.warn(`Access denied for non-admin user: ${userId}`);
      throw new Error('Forbidden: Admin access required');
    }

    console.log('Admin access verified for user:', userId);
    return profile;

  } catch (error) {
    console.error('Admin verification error:', error);
    throw error;
  }
}

/**
 * Verify that the user is authenticated (not necessarily admin)
 * 
 * @param {Object} event - API Gateway event with JWT claims
 * @returns {Promise<Object>} User object
 */
async function verifyUser(event) {
  try {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    
    if (!userId) {
      throw new Error('Unauthorized: No user ID in token');
    }

    console.log('Verifying user access for:', userId);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error('Unauthorized: User not found');
    }

    return profile;

  } catch (error) {
    console.error('User verification error:', error);
    throw error;
  }
}

/**
 * Get user ID from event
 * 
 * @param {Object} event - API Gateway event
 * @returns {string|null} User ID or null
 */
function getUserId(event) {
  return event.requestContext?.authorizer?.jwt?.claims?.sub || null;
}

/**
 * Create error response
 * 
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} details - Additional error details
 * @returns {Object} API Gateway response
 */
function errorResponse(statusCode, message, details = null) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: {
        message,
        details,
        timestamp: new Date().toISOString()
      }
    })
  };
}

/**
 * Create success response
 * 
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default 200)
 * @returns {Object} API Gateway response
 */
function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
}

module.exports = {
  verifyAdmin,
  verifyUser,
  getUserId,
  errorResponse,
  successResponse
};
