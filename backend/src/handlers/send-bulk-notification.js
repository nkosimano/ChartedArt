const { createClient } = require('@supabase/supabase-js');
const { verifyAdmin, errorResponse, successResponse } = require('../utils/auth');
const { sendBulkNotifications } = require('../utils/pushNotifications');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Send bulk push notifications to multiple users
 * Admin only endpoint
 */
exports.handler = async (event) => {
  console.log('Send Bulk Notification - Event:', JSON.stringify(event, null, 2));

  try {
    // Verify admin authentication
    const admin = await verifyAdmin(event);
    console.log(`Admin ${admin.id} sending bulk notification`);

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { title, body: messageBody, userIds, type = 'admin_broadcast' } = body;

    // Validate required fields
    if (!title) {
      return errorResponse(400, 'Notification title is required');
    }

    if (!messageBody) {
      return errorResponse(400, 'Notification body is required');
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse(400, 'User IDs array is required');
    }

    // Limit to 1000 users per request
    if (userIds.length > 1000) {
      return errorResponse(400, 'Maximum 1000 users per request');
    }

    console.log(`Sending notification to ${userIds.length} users`);

    // Send bulk notifications
    const result = await sendBulkNotifications(
      supabase,
      userIds,
      title,
      messageBody,
      { type, sentBy: admin.id }
    );

    console.log(`Bulk notification result: ${result.sent} sent, ${result.failed} failed`);

    // Log admin action
    await supabase.from('admin_activity_log').insert({
      admin_id: admin.id,
      action: 'send_bulk_notification',
      details: {
        title,
        recipientCount: userIds.length,
        sent: result.sent,
        failed: result.failed
      },
      created_at: new Date().toISOString()
    });

    return successResponse({
      message: 'Bulk notifications sent',
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined // Limit error details
    });

  } catch (error) {
    console.error('Error in send bulk notification handler:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin')) {
      return errorResponse(403, error.message);
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};
