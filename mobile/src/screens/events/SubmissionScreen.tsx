import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import apiClient from '../../lib/api/client';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

type Step = 'upload' | 'details' | 'confirm';

export default function SubmissionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params as { eventId: string };

  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to submit artwork.'
      );
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setError(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setError(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage || !title.trim()) {
      setError('Please provide a title for your submission');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(selectedImage);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      const filename = selectedImage.split('/').pop() || 'submission.jpg';
      const contentType = 'image/jpeg';

      // Step 1: Request upload URL (20% progress)
      setUploadProgress(20);
      const uploadResponse = await apiClient.post<{
        uploadUrl: string;
        submissionId: string;
        expiresIn: number;
      }>(`/events/${eventId}/submissions/upload-request`, {
        title: title.trim(),
        description: description.trim(),
        filename,
        contentType,
        fileSize: fileInfo.size,
      });

      // Step 2: Upload file to S3 (60% progress)
      setUploadProgress(40);
      
      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob for upload
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Upload to S3
      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(80);

      // Step 3: Confirm submission (100% progress)
      await apiClient.post(
        `/events/${eventId}/submissions/${uploadResponse.submissionId}/confirm`,
        {}
      );

      setUploadProgress(100);
      setCurrentStep('confirm');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload submission');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'upload' && selectedImage) {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      handleUpload();
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('upload');
    } else if (currentStep === 'upload') {
      navigation.goBack();
    }
  };

  const handleComplete = () => {
    navigation.goBack();
  };

  const steps = [
    { id: 'upload', label: 'Upload' },
    { id: 'details', label: 'Details' },
    { id: 'confirm', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} disabled={uploading}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Entry</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  index <= currentStepIndex && styles.stepCircleActive,
                ]}
              >
                {index < currentStepIndex ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      index <= currentStepIndex && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  index < currentStepIndex && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Upload Your Artwork</Text>
            <Text style={styles.stepDescription}>
              Select an image from your gallery or take a new photo
            </Text>

            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={pickImageFromLibrary}
                >
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImageFromLibrary}>
                  <Ionicons name="images-outline" size={48} color={COLORS.primary} />
                  <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={48} color={COLORS.primary} />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Details Step */}
        {currentStep === 'details' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Details</Text>
            <Text style={styles.stepDescription}>
              Give your submission a title and description
            </Text>

            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.thumbnailPreview} />
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a title for your artwork"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about your artwork (optional)"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* Confirm Step */}
        {currentStep === 'confirm' && (
          <View style={styles.stepContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Submission Complete!</Text>
            <Text style={styles.successDescription}>
              Your artwork has been successfully submitted to the competition.
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleComplete}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Upload Progress */}
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading... {uploadProgress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      {currentStep !== 'confirm' && !uploading && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleBack}
          >
            <Text style={styles.buttonSecondaryText}>
              {currentStep === 'upload' ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              ((currentStep === 'upload' && !selectedImage) ||
                (currentStep === 'details' && !title.trim())) &&
                styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={
              (currentStep === 'upload' && !selectedImage) ||
              (currentStep === 'details' && !title.trim())
            }
          >
            <Text style={styles.buttonPrimaryText}>
              {currentStep === 'details' ? 'Submit' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  stepsContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  stepWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#FEE2E2',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 8,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: '#DC2626',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  stepDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  uploadOptions: {
    width: '100%',
    gap: SPACING.md,
  },
  uploadButton: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  changeImageButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  changeImageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  thumbnailPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  formGroup: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  input: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: 100,
  },
  successIcon: {
    marginBottom: SPACING.lg,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl * 2,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  doneButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  uploadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonPrimaryText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
  },
});

