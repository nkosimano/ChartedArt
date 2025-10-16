const { createClient } = require('@supabase/supabase-js');
const { verifyAdmin, errorResponse, successResponse } = require('../utils/auth');
const { sendOrderStatusNotification } = require('../utils/pushNotifications');

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
 * Update order status
 * Sends push notification to user when status changes
 */
exports.handler = async (event) => {
  console.log('Update Order Status - Event:', JSON.stringify(event, null, 2));

  try {
    // Verify admin authentication
    const admin = await verifyAdmin(event);
    console.log(`Admin ${admin.id} updating order status`);

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { orderId, status, notes } = body;

    // Validate required fields
    if (!orderId) {
      return errorResponse(400, 'Order ID is required');
    }

    if (!status) {
      return errorResponse(400, 'Status is required');
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Get current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      return errorResponse(404, 'Order not found', fetchError.message);
    }

    // Check if status is actually changing
    if (currentOrder.status === status) {
      return successResponse({
        message: 'Order status unchanged',
        order: currentOrder
      });
    }

    console.log(`Updating order ${orderId} from ${currentOrder.status} to ${status}`);

    // Update order status
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add status-specific fields
    if (status === 'shipped' && !currentOrder.shipped_at) {
      updateData.shipped_at = new Date().toISOString();
    }

    if (status === 'delivered' && !currentOrder.delivered_at) {
      updateData.delivered_at = new Date().toISOString();
    }

    if (notes) {
      updateData.admin_notes = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return errorResponse(500, 'Failed to update order', updateError.message);
    }

    console.log(`Order ${orderId} updated successfully to status: ${status}`);

    // Send push notification to user (async, don't wait)
    sendOrderStatusNotification(supabase, orderId, status, currentOrder.user_id)
      .then(result => {
        if (result.success) {
          console.log(`Push notification sent to user ${currentOrder.user_id}`);
        } else {
          console.warn(`Failed to send push notification: ${result.error}`);
        }
      })
      .catch(error => {
        console.error('Error sending push notification:', error);
      });

    // Log status change
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      previous_status: currentOrder.status,
      new_status: status,
      changed_by: admin.id,
      notes: notes || null,
      created_at: new Date().toISOString()
    });

    return successResponse({
      message: 'Order status updated successfully',
      order: updatedOrder,
      previous_status: currentOrder.status
    });

  } catch (error) {
    console.error('Error in update order status handler:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin')) {
      return errorResponse(403, error.message);
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};
