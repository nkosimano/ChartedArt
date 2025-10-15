import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
}

export const useImagePicker = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  /**
   * Request media library permissions
   */
  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission is required to select images. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  /**
   * Pick an image from the gallery
   */
  const pickImage = async (): Promise<ImageResult | null> => {
    try {
      // Request permission
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        return null;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    }
  };

  /**
   * Take a photo with the camera
   */
  const takePhoto = async (): Promise<ImageResult | null> => {
    try {
      // Request permission
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  };

  return {
    pickImage,
    takePhoto,
    uploading,
    progress,
  };
};
