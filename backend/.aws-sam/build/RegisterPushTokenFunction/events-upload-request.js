/**
 * Generate Upload URL Handler
 * POST /events/:id/upload-request
 * Returns presigned S3 URL for secure file upload
 */

const AWS = require('aws-sdk');
const crypto = require('crypto');
const { getSupabaseClient, insertRecord } = require('../utils/supabase');
const { success, notFound, badRequest, unauthorized, tooManyRequests, internalError, handleOptions, parseBody, validateRequiredFields, getUserIdFromEvent } = require('../utils/response');

// Rate limiting: 10 uploads per user per hour
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) return unauthorized('Authentication required');
    
    const eventId = event.pathParameters?.id;
    if (!eventId) return badRequest('Event ID required');
    
    const body = parseBody(event);
    const validation = validateRequiredFields(body, ['filename', 'contentType', 'fileSize']);
    if (!validation.valid) return badRequest(validation.message);
    
    const { filename, contentType, fileSize } = body;
    
    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return badRequest('Only JPEG, PNG, and WebP images are allowed');
    }
    
    // Validate file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      return badRequest('File size must be less than 10MB');
    }
    
    const supabase = getSupabaseClient();
    
    // Verify event exists and user is registered
    const { data: eventData } = await supabase
      .from('events')
      .select('id, title, event_type')
      .eq('id', eventId)
      .single();
    
    if (!eventData) return notFound('Event');
    
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('registration_status', 'confirmed')
      .single();
    
    if (!registration) {
      return badRequest('You must be registered for this event to submit');
    }
    
    // Rate limiting check
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
    const { count } = await supabase
      .from('submission_upload_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .gte('created_at', oneHourAgo);
    
    if (count >= RATE_LIMIT) {
      return tooManyRequests('Upload limit exceeded. Please try again later.');
    }
    
    // Generate unique S3 key
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `submissions/${eventId}/${userId}/${timestamp}-${randomString}-${sanitizedFilename}`;
    
    // Generate presigned URL (5 minutes expiry)
    const s3 = new AWS.S3({
      signatureVersion: 'v4',
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
      Expires: 300 // 5 minutes
    });
    
    // Generate upload token
    const uploadToken = crypto.randomBytes(32).toString('hex');
    
    // Create upload request record
    await insertRecord('submission_upload_requests', {
      user_id: userId,
      event_id: eventId,
      filename: sanitizedFilename,
      file_type: contentType,
      file_size: fileSize,
      upload_token: uploadToken,
      presigned_url: uploadUrl,
      s3_key: s3Key,
      s3_bucket: process.env.S3_BUCKET_NAME,
      expires_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes
      upload_status: 'pending'
    });
    
    return success({
      upload_url: uploadUrl,
      upload_token: uploadToken,
      s3_key: s3Key,
      expires_in: 300,
      max_file_size: 10 * 1024 * 1024,
      allowed_types: allowedTypes
    });
    
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return internalError('Failed to generate upload URL', error);
  }
};
