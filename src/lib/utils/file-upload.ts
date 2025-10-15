import { api } from '../api/client';

/**
 * Upload a file securely using presigned S3 URLs
 * 
 * @param file - File to upload
 * @returns Object with fileKey and temporary preview URL
 */
export async function uploadFileSecurely(file: File): Promise<{
  fileKey: string;
  previewUrl: string;
}> {
  // Step 1: Get presigned URL from backend
  console.log('Requesting presigned URL for file upload...');
  const { uploadUrl, fileKey } = await api.uploads.generateUrl(
    file.name,
    file.type,
    file.size
  );

  // Step 2: Upload file directly to S3 using presigned URL
  console.log('Uploading file to S3...');
  await api.uploads.uploadFile(file, uploadUrl);

  // Step 3: Return file key and create temporary preview URL
  // Note: The file will be scanned by antivirus Lambda automatically
  console.log('File uploaded successfully:', fileKey);

  // Create temporary preview URL for immediate display
  const previewUrl = URL.createObjectURL(file);

  return {
    fileKey,
    previewUrl
  };
}

/**
 * Delete a file from S3
 * Note: This requires a backend endpoint to be implemented
 * 
 * @param fileKey - S3 file key to delete
 */
export async function deleteFileSecurely(fileKey: string): Promise<void> {
  // TODO: Implement delete endpoint in backend
  console.log('File deletion not yet implemented for:', fileKey);
  // For now, files will be cleaned up by S3 lifecycle policies
}
