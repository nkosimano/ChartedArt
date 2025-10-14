const { createClient } = require('@supabase/supabase-js');
const { verifyAdmin, errorResponse, successResponse } = require('../utils/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Valid order statuses
const VALID_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
];

/**
 * Update order status (Admin only)
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} Response with updated order
 */
exports.handler = async (event) => {
  console.log('Update Order Status - Event:', JSON.stringify(event, null, 2));

  try {
    // Verify admin access
    await verifyAdmin(event);

    // Get order ID from path parameters
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return errorResponse(400, 'Order ID is required');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { status, notes } = body;

    // Validate status
    if (!status) {
      return errorResponse(400, 'Status is required');
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    console.log(`Updating order ${orderId} to status: ${status}`);

    // Check if order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error('Order not found:', orderId);
      return errorResponse(404, 'Order not found');
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(notes && { admin_notes: notes })
      })
      .eq('id', orderId)
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
            price
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return errorResponse(500, 'Failed to update order', updateError.message);
    }

    console.log(`Order ${orderId} updated successfully to status: ${status}`);

    // TODO: Send email notification to customer about status change
    // await sendOrderStatusEmail(updatedOrder);

    return successResponse({
      order: updatedOrder,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error in update order status handler:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return errorResponse(
        error.message.includes('Forbidden') ? 403 : 401,
        error.message
      );
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};
