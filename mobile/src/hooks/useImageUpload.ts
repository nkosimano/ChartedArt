import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import apiClient from '../lib/api/client';

interface UploadUrlResponse {
  uploadUrl: string;
  imageKey: string;
  imageUrl: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Upload an image to S3 using presigned URL
   */
  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      setUploading(true);
      setProgress(0);

      // Step 1: Get presigned URL from backend
      setProgress(10);
      const uploadData = await apiClient.post<UploadUrlResponse>(
        '/generate-upload-url',
        {
          contentType: 'image/jpeg',
        }
      );

      if (!uploadData.uploadUrl || !uploadData.imageUrl) {
        throw new Error('Failed to get upload URL');
      }

      // Step 2: Upload image to S3
      setProgress(30);
      
      const uploadResult = await FileSystem.uploadAsync(
        uploadData.uploadUrl,
        imageUri,
        {
          httpMethod: 'PUT',
          headers: {
            'Content-Type': 'image/jpeg',
          },
          // Casting due to missing type export in expo-file-system typings
          uploadType: (FileSystem as any).FileSystemUploadType?.BINARY_CONTENT,
        }
      );

      if (uploadResult.status !== 200) {
        throw new Error('Failed to upload image to S3');
      }

      setProgress(100);
      
      // Return the public URL of the uploaded image
      return uploadData.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Error', errorMessage);
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadImage,
    uploading,
    progress,
  };
};
