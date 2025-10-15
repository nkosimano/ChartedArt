const { createClient } = require('@supabase/supabase-js');
const { verifyAdmin, errorResponse, successResponse } = require('../utils/auth');
<<<<<<< HEAD
const fetch = require('node-fetch');
=======
>>>>>>> e4002856974d5c66721f668a6fc291ee96224278

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

<<<<<<< HEAD
// Expo Push Notification API endpoint
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

=======
>>>>>>> e4002856974d5c66721f668a6fc291ee96224278
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
<<<<<<< HEAD
 * Send push notification to user via Expo Push API
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken) {
    console.log('No push token provided, skipping notification');
    return;
  }

  // Validate token format
  if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
    console.error('Invalid push token format:', pushToken);
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'default',
  };

  try {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data && result.data.status === 'error') {
      console.error('Expo Push API error:', result.data.message);
      
      // If token is invalid, clear it from database
      if (result.data.details && result.data.details.error === 'DeviceNotRegistered') {
        console.log('Push token is invalid, should clear from database');
        // TODO: Clear invalid token from profiles table
      }
    } else {
      console.log('Push notification sent successfully:', result);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw error - notification failure shouldn't break order update
  }
};

/**
 * Get notification message based on order status
 */
const getNotificationMessage = (status, orderId) => {
  const orderIdShort = orderId.substring(0, 8);
  
  switch (status) {
    case 'confirmed':
      return {
        title: 'Order Confirmed',
        body: `Your order #${orderIdShort} has been confirmed and is being prepared.`,
      };
    case 'processing':
      return {
        title: 'Order Processing',
        body: `Your order #${orderIdShort} is now being processed.`,
      };
    case 'shipped':
      return {
        title: 'Order Shipped! 📦',
        body: `Great news! Your order #${orderIdShort} has been shipped and is on its way.`,
      };
    case 'delivered':
      return {
        title: 'Order Delivered! 🎉',
        body: `Your order #${orderIdShort} has been delivered. Enjoy your custom art!`,
      };
    case 'cancelled':
      return {
        title: 'Order Cancelled',
        body: `Your order #${orderIdShort} has been cancelled.`,
      };
    case 'refunded':
      return {
        title: 'Order Refunded',
        body: `Your order #${orderIdShort} has been refunded. The amount will be returned to your account.`,
      };
    default:
      return null;
  }
};

/**
=======
>>>>>>> e4002856974d5c66721f668a6fc291ee96224278
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

<<<<<<< HEAD
    // Send push notification if status changed and user has push token
    if (existingOrder.status !== status) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', updatedOrder.user_id)
        .single();

      if (profile?.push_token) {
        const notification = getNotificationMessage(status, orderId);
        if (notification) {
          await sendPushNotification(
            profile.push_token,
            notification.title,
            notification.body,
            {
              orderId,
              status,
              screen: 'OrderDetail',
            }
          );
        }
      }
    }

=======
>>>>>>> e4002856974d5c66721f668a6fc291ee96224278
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
