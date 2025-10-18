/**
 * Register Push Token Handler
 * Stores Expo push notification token for user
 */

const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('../utils/auth');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Validate push token format
 */
const isValidExpoPushToken = (token) => {
  // Expo push tokens start with ExponentPushToken[ or ExpoPushToken[
  return (
    token &&
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
};

/**
 * Main handler function
 */
exports.handler = async (event) => {
  console.log('Register Push Token - Event:', JSON.stringify(event, null, 2));

  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: {
          message: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED',
        },
      }),
    };
  }

  try {
    // Verify JWT token and get user
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const user = await verifyToken(authHeader);

    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: {
            message: 'Unauthorized - Invalid or missing token',
            code: 'UNAUTHORIZED',
          },
        }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body);
    const { token } = body;

    // Validate token
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: {
            message: 'Push token is required',
            code: 'MISSING_TOKEN',
          },
        }),
      };
    }

    if (!isValidExpoPushToken(token)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: {
            message: 'Invalid push token format',
            code: 'INVALID_TOKEN',
          },
        }),
      };
    }

    // Update user profile with push token
    const { data, error } = await supabase
      .from('profiles')
      .update({
        push_token: token,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq('id', user.sub)
      .select()
      .single();

    if (error) {
      console.error('Error updating push token:', error);

      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.sub,
            email: user.email,
            push_token: token,
            push_token_updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile with push token:', insertError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: {
                message: 'Failed to register push token',
                code: 'REGISTRATION_FAILED',
                details: insertError.message,
              },
            }),
          };
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: 'Push token registered successfully',
            profile: {
              id: newProfile.id,
              push_token: newProfile.push_token,
            },
          }),
        };
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: {
            message: 'Failed to update push token',
            code: 'UPDATE_FAILED',
            details: error.message,
          },
        }),
      };
    }

    console.log(`Push token registered for user ${user.sub}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Push token updated successfully',
        profile: {
          id: data.id,
          push_token: data.push_token,
        },
      }),
    };
  } catch (error) {
    console.error('Error in register-push-token handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: error.message,
        },
      }),
    };
  }
};
