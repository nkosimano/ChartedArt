import { supabase } from './supabase/client';

const S3_BUCKET_NAME = import.meta.env.VITE_S3_BUCKET_NAME;
const S3_BUCKET_URL = import.meta.env.VITE_S3_BUCKET_URL;
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';

interface UploadResponse {
  url: string;
  key: string;
}

/**
 * Upload file to S3 bucket
 * Uses AWS SDK via backend Lambda function for secure uploads
 */
export async function uploadToS3(file: File): Promise<UploadResponse> {
  try {
    // Get authenticated session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Generate unique file key
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `uploads/${session.user.id}/${timestamp}-${sanitizedFileName}`;

    // For now, use a simple direct upload approach
    // TODO: Replace with presigned URL from backend Lambda for production
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', fileKey);

    // Upload directly to S3 (requires CORS configuration)
    const uploadUrl = `${S3_BUCKET_URL}/${fileKey}`;
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return {
      url: uploadUrl,
      key: fileKey,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

/**
 * Get a presigned URL for uploading to S3
 * This should be called from backend Lambda for security
 */
export async function getPresignedUploadUrl(fileName: string, fileType: string): Promise<{
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Call backend Lambda to generate presigned URL
    // TODO: Implement this endpoint in backend
    const response = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileName,
        fileType,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Presigned URL error:', error);
    throw error;
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(fileKey: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Call backend Lambda to delete file
    // TODO: Implement this endpoint in backend
    const response = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/delete-file`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileKey,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
}
