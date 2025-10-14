const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Allowed file types for uploads
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Generate a presigned URL for uploading files to S3
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} Response with presigned URL and file key
 */
exports.handler = async (event) => {
  console.log('Generate Upload URL - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { filename, contentType, fileSize } = body;

    // Validate required fields
    if (!filename || !contentType) {
      return errorResponse(400, 'Missing required fields: filename and contentType');
    }

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return errorResponse(400, `Invalid file type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`);
    }

    // Validate file size
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return errorResponse(400, `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Get user ID from JWT token (passed by API Gateway authorizer)
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User ID not found in token');
    }

    // Generate unique file key
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `uploads/${userId}/${timestamp}-${sanitizedFilename}`;

    // Create S3 PutObject command with metadata
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      // Tag file as unscanned for lifecycle policy
      Tagging: 'scanned=false',
      // Metadata for tracking
      Metadata: {
        'user-id': userId,
        'original-filename': filename,
        'upload-timestamp': timestamp.toString()
      }
    });

    // Generate presigned URL (expires in 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 300 // 5 minutes
    });

    console.log('Presigned URL generated successfully:', { fileKey, userId });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl,
        fileKey,
        expiresIn: 300,
        message: 'Upload URL generated successfully'
      })
    };

  } catch (error) {
    console.error('Error generating upload URL:', error);
    return errorResponse(500, 'Failed to generate upload URL', error.message);
  }
};

/**
 * Helper function to create error responses
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
