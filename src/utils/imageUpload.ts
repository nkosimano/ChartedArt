import { supabase } from '../lib/supabase';

// Configuration constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2048; // Max width or height in pixels
const JPEG_QUALITY = 0.85;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Supported image formats
export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  bucket?: string;
  folder?: string;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  path: string;
  size: number;
  dimensions: { width: number; height: number };
}

export interface ImageValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'INVALID_DIMENSIONS' | 'UPLOAD_FAILED';
  message: string;
}

// Validate image file
export const validateImage = (file: File): ImageValidationError | null => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_TYPE',
      message: 'Only JPEG, PNG, WebP, and GIF files are allowed'
    };
  }

  return null;
};

// Get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// Compress and resize image
const compressImage = (
  file: File,
  options: ImageUploadOptions = {}
): Promise<{ file: File; dimensions: { width: number; height: number } }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        maxWidth = MAX_DIMENSION,
        maxHeight = MAX_DIMENSION,
        quality = JPEG_QUALITY
      } = options;

      // Get original dimensions
      const originalDimensions = await getImageDimensions(file);
      
      // Check if compression is needed
      const needsCompression = 
        originalDimensions.width > maxWidth || 
        originalDimensions.height > maxHeight ||
        file.size > MAX_FILE_SIZE / 2; // Compress if larger than 5MB

      if (!needsCompression) {
        resolve({ file, dimensions: originalDimensions });
        return;
      }

      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = originalDimensions;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file with compressed blob
            const compressedFile = new File([blob], file.name, {
              type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
              lastModified: Date.now()
            });

            resolve({ 
              file: compressedFile, 
              dimensions: { width: Math.round(width), height: Math.round(height) }
            });
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for compression'));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
};

// Generate thumbnail
const generateThumbnail = (
  file: File,
  size: number = 300
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate thumbnail dimensions (square crop from center)
      const { width: origWidth, height: origHeight } = img;
      const minDimension = Math.min(origWidth, origHeight);
      
      const sourceX = (origWidth - minDimension) / 2;
      const sourceY = (origHeight - minDimension) / 2;

      canvas.width = size;
      canvas.height = size;

      // Draw cropped and resized thumbnail
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        minDimension,
        minDimension,
        0,
        0,
        size,
        size
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail'));
            return;
          }

          const thumbnailFile = new File([blob], `thumb_${file.name}`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          resolve(thumbnailFile);
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail'));
    };

    img.src = url;
  });
};

// Generate unique filename
const generateFileName = (originalName: string, folder?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || 'jpg';
  const baseName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  const fileName = `${timestamp}_${random}_${baseName}.${ext}`;
  return folder ? `${folder}/${fileName}` : fileName;
};

// Upload single image to Supabase Storage
export const uploadImage = async (
  file: File,
  userId: string,
  options: ImageUploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Validate image
    const validationError = validateImage(file);
    if (validationError) {
      throw new Error(validationError.message);
    }

    const {
      bucket = 'artwork-images',
      folder = 'uploads',
      generateThumbnail: shouldGenerateThumbnail = true,
      thumbnailSize = 300
    } = options;

    // Compress main image
    const { file: compressedFile, dimensions } = await compressImage(file, options);
    
    // Generate file paths
    const mainPath = generateFileName(file.name, `${folder}/${userId}`);
    const thumbnailPath = shouldGenerateThumbnail ? 
      generateFileName(`thumb_${file.name}`, `${folder}/${userId}/thumbnails`) : 
      null;

    // Upload main image
    const { data: mainUpload, error: mainError } = await supabase.storage
      .from(bucket)
      .upload(mainPath, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (mainError) {
      throw new Error(`Upload failed: ${mainError.message}`);
    }

    // Get public URL for main image
    const { data: mainUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(mainPath);

    let thumbnailUrl: string | undefined;

    // Generate and upload thumbnail if requested
    if (shouldGenerateThumbnail && thumbnailPath) {
      try {
        const thumbnailFile = await generateThumbnail(compressedFile, thumbnailSize);
        
        const { error: thumbError } = await supabase.storage
          .from(bucket)
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      } catch (thumbError) {
        console.warn('Failed to generate thumbnail:', thumbError);
        // Continue without thumbnail
      }
    }

    return {
      url: mainUrlData.publicUrl,
      thumbnailUrl,
      path: mainPath,
      size: compressedFile.size,
      dimensions
    };

  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Upload failed');
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: File[],
  userId: string,
  options: ImageUploadOptions = {}
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const result = await uploadImage(file, userId, options);
      results.push(result);
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All uploads failed: ${errors.join(', ')}`);
  }

  if (errors.length > 0) {
    console.warn('Some uploads failed:', errors);
  }

  return results;
};

// Delete image from storage
export const deleteImage = async (path: string, bucket: string = 'artwork-images'): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Delete failed');
  }
};

// Get image URL with transformations
export const getImageUrl = (
  path: string,
  bucket: string = 'artwork-images',
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): string => {
  let url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  
  if (transform) {
    const params = new URLSearchParams();
    
    if (transform.width) params.append('width', transform.width.toString());
    if (transform.height) params.append('height', transform.height.toString());
    if (transform.quality) params.append('quality', transform.quality.toString());
    if (transform.format) params.append('format', transform.format);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  return url;
};

// Image upload hook for React components
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const uploadWithProgress = async (
    files: File[],
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult[]> => {
    setIsUploading(true);
    setUploadErrors([]);
    setUploadProgress({});

    try {
      const results: UploadResult[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressKey = `${file.name}_${i}`;
        
        try {
          setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
          
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [progressKey]: Math.min((prev[progressKey] || 0) + 10, 90)
            }));
          }, 200);

          const result = await uploadImage(file, userId, options);
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
          
          results.push(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          errors.push(`${file.name}: ${errorMessage}`);
          setUploadProgress(prev => ({ ...prev, [progressKey]: -1 })); // -1 indicates error
        }
      }

      setUploadErrors(errors);
      return results;
    } finally {
      setIsUploading(false);
      // Clear progress after delay
      setTimeout(() => setUploadProgress({}), 2000);
    }
  };

  const clearErrors = () => setUploadErrors([]);

  return {
    isUploading,
    uploadProgress,
    uploadErrors,
    uploadWithProgress,
    clearErrors
  };
};

// React component type for image upload areas
import { useState } from 'react';

export interface ImageUploadAreaProps {
  onUpload: (results: UploadResult[]) => void;
  onError: (error: string) => void;
  userId: string;
  options?: ImageUploadOptions;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

// Utility to create drag and drop handlers
export const createDragAndDropHandlers = (
  onFiles: (files: File[]) => void,
  maxFiles: number = 10
) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      ALLOWED_TYPES.includes(file.type)
    );

    if (files.length > maxFiles) {
      files.splice(maxFiles);
    }

    onFiles(files);
  };

  return {
    onDragOver: handleDragOver,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop
  };
};

// File input handler
export const createFileInputHandler = (
  onFiles: (files: File[]) => void,
  maxFiles: number = 10
) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      ALLOWED_TYPES.includes(file.type)
    );

    if (files.length > maxFiles) {
      files.splice(maxFiles);
    }

    onFiles(files);
    
    // Reset input value to allow same file selection
    e.target.value = '';
  };
};