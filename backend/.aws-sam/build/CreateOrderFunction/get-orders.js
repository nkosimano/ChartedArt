const { createClient } = require('@supabase/supabase-js');
const { verifyAdmin, errorResponse, successResponse } = require('../utils/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Get all orders (Admin only)
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} Response with orders list
 */
exports.handler = async (event) => {
  console.log('Get Orders - Event:', JSON.stringify(event, null, 2));

  try {
    // Verify admin access
    await verifyAdmin(event);

    // Parse query parameters for filtering
    const queryParams = event.queryStringParameters || {};
    const { status, limit = '100', offset = '0', sort = 'created_at' } = queryParams;

    console.log('Fetching orders with params:', { status, limit, offset, sort });

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        ),
        order_items (
          *,
          products (
            id,
            name,
            price,
            image_url
          )
        )
      `)
      .order(sort, { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Execute query
    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return errorResponse(500, 'Failed to fetch orders', error.message);
    }

    console.log(`Successfully fetched ${orders?.length || 0} orders`);

    return successResponse({
      orders: orders || [],
      count: orders?.length || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error in get orders handler:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return errorResponse(
        error.message.includes('Forbidden') ? 403 : 401,
        error.message
      );
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};
