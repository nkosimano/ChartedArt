/**
 * Push Notification Utilities
 * Handles sending push notifications via Expo Push Notification Service
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification via Expo
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} Result of push notification
 */
async function sendExpoPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken) {
    console.warn('No push token provided');
    return { success: false, error: 'No push token' };
  }

  // Validate Expo push token format
  if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
    console.warn('Invalid push token format:', pushToken);
    return { success: false, error: 'Invalid token format' };
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
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    // Check for errors in response
    if (result.data && result.data[0]) {
      const ticket = result.data[0];
      
      if (ticket.status === 'error') {
        console.error('Push notification error:', ticket);
        return { 
          success: false, 
          error: ticket.message || 'Unknown error',
          details: ticket.details 
        };
      }
      
      if (ticket.status === 'ok') {
        return { 
          success: true, 
          ticket: ticket.id 
        };
      }
    }

    return { success: true, result };
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send order status update notification
 * @param {Object} supabase - Supabase client
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New order status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result of notification
 */
async function sendOrderStatusNotification(supabase, orderId, newStatus, userId) {
  try {
    // Get user's push token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_token, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return { success: false, error: 'User not found' };
    }

    if (!profile?.push_token) {
      console.log(`No push token for user ${userId}`);
      return { success: false, error: 'No push token' };
    }

    // Create notification message based on status
    const messages = {
      pending: {
        title: '⏳ Order Received',
        body: 'We\'ve received your order and will process it soon!',
      },
      processing: {
        title: '🎨 Order Processing',
        body: 'Your custom artwork is being prepared!',
      },
      shipped: {
        title: '📦 Order Shipped',
        body: 'Your artwork is on its way to you!',
      },
      delivered: {
        title: '✅ Order Delivered',
        body: 'Your order has been delivered. Enjoy your art!',
      },
      cancelled: {
        title: '❌ Order Cancelled',
        body: 'Your order has been cancelled.',
      },
    };

    const message = messages[newStatus] || {
      title: 'Order Update',
      body: `Your order status: ${newStatus}`,
    };

    // Send notification
    const result = await sendExpoPushNotification(
      profile.push_token,
      message.title,
      message.body,
      { 
        orderId, 
        status: newStatus, 
        screen: 'OrderDetail',
        type: 'order_status'
      }
    );

    // Log notification attempt
    await supabase.from('push_notification_log').insert({
      user_id: userId,
      notification_type: 'order_status',
      title: message.title,
      body: message.body,
      data: { orderId, status: newStatus },
      sent_at: new Date().toISOString(),
      delivered: result.success,
      error_message: result.error || null,
    });

    return result;
  } catch (error) {
    console.error('Error sending order status notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk notifications to multiple users
 * @param {Object} supabase - Supabase client
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<Object>} Results summary
 */
async function sendBulkNotifications(supabase, userIds, title, body, data = {}) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Get push tokens for all users
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, push_token')
    .in('id', userIds)
    .not('push_token', 'is', null);

  if (error) {
    console.error('Error fetching user profiles:', error);
    return { ...results, errors: [error.message] };
  }

  if (!profiles || profiles.length === 0) {
    return { ...results, errors: ['No users with push tokens found'] };
  }

  // Send notifications in batches of 100 (Expo limit)
  const batchSize = 100;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    
    const messages = batch.map(profile => ({
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      
      if (result.data) {
        result.data.forEach((ticket, index) => {
          if (ticket.status === 'ok') {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`User ${batch[index].id}: ${ticket.message}`);
          }
        });
      }
    } catch (error) {
      console.error('Error sending batch notifications:', error);
      results.failed += batch.length;
      results.errors.push(error.message);
    }

    // Log all notifications
    const logs = batch.map((profile, index) => ({
      user_id: profile.id,
      notification_type: data.type || 'bulk',
      title,
      body,
      data,
      sent_at: new Date().toISOString(),
      delivered: result?.data?.[index]?.status === 'ok',
      error_message: result?.data?.[index]?.message || null,
    }));

    await supabase.from('push_notification_log').insert(logs);
  }

  return results;
}

/**
 * Send promotional notification
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Result
 */
async function sendPromotionalNotification(supabase, userId, title, body, data = {}) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .single();

  if (!profile?.push_token) {
    return { success: false, error: 'No push token' };
  }

  const result = await sendExpoPushNotification(
    profile.push_token,
    title,
    body,
    { ...data, type: 'promotional' }
  );

  // Log notification
  await supabase.from('push_notification_log').insert({
    user_id: userId,
    notification_type: 'promotional',
    title,
    body,
    data,
    sent_at: new Date().toISOString(),
    delivered: result.success,
    error_message: result.error || null,
  });

  return result;
}

module.exports = {
  sendExpoPushNotification,
  sendOrderStatusNotification,
  sendBulkNotifications,
  sendPromotionalNotification,
};
