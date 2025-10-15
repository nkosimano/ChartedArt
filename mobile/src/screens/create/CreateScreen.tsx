import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker } from '../../hooks/useImagePicker';
import { useImageUpload } from '../../hooks/useImageUpload';
import apiClient from '../../lib/api/client';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface CreateScreenProps {
  navigation: any;
}

const SIZES = [
  { id: '8x10', label: '8" x 10"', price: 29.99 },
  { id: '11x14', label: '11" x 14"', price: 39.99 },
  { id: '16x20', label: '16" x 20"', price: 59.99 },
  { id: '24x36', label: '24" x 36"', price: 89.99 },
];

const FRAMES = [
  { id: 'none', label: 'No Frame', price: 0 },
  { id: 'black', label: 'Black Frame', price: 15 },
  { id: 'white', label: 'White Frame', price: 15 },
  { id: 'wood', label: 'Wood Frame', price: 20 },
];

export default function CreateScreen({ navigation }: CreateScreenProps) {
  const { pickImage, takePhoto } = useImagePicker();
  const { uploadImage, uploading } = useImageUpload();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
  const [addingToCart, setAddingToCart] = useState(false);

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      setSelectedImage(result.uri);
      setUploadedImageUrl(null);
      
      // Upload image
      const imageUrl = await uploadImage(result.uri);
      if (imageUrl) {
        setUploadedImageUrl(imageUrl);
      }
    }
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (result) {
      setSelectedImage(result.uri);
      setUploadedImageUrl(null);
      
      // Upload image
      const imageUrl = await uploadImage(result.uri);
      if (imageUrl) {
        setUploadedImageUrl(imageUrl);
      }
    }
  };

  const calculatePrice = () => {
    return selectedSize.price + selectedFrame.price;
  };

  const handleAddToCart = async () => {
    // Validate that an image has been uploaded
    if (!uploadedImageUrl) {
      Alert.alert('No Image', 'Please select and upload an image first.');
      return;
    }

    try {
      setAddingToCart(true);

      // Call the backend API to add item to cart
      await apiClient.post('/cart', {
        imageUrl: uploadedImageUrl,
        name: `Custom Print - ${selectedSize.label}`,
        size: selectedSize.id,
        frame: selectedFrame.id,
        price: calculatePrice(),
        quantity: 1,
      });

      // Show success message
      Alert.alert(
        'Added to Cart',
        'Your custom print has been added to your cart!',
        [
          {
            text: 'Continue Shopping',
            style: 'cancel',
          },
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('Cart'),
          },
        ]
      );

      // Reset the form
      setSelectedImage(null);
      setUploadedImageUrl(null);
      setSelectedSize(SIZES[0]);
      setSelectedFrame(FRAMES[0]);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert(
        'Error',
        'Failed to add item to cart. Please try again.'
      );
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Art</Text>
        <Text style={styles.subtitle}>Select or capture an image to get started</Text>

        {/* Image Selection */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <LoadingSpinner />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={handlePickImage}
              disabled={uploading}
            >
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={handleTakePhoto}
              disabled={uploading}
            >
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Size Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Size</Text>
          <View style={styles.optionsGrid}>
            {SIZES.map((size) => (
              <TouchableOpacity
                key={size.id}
                style={[
                  styles.optionCard,
                  selectedSize.id === size.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    selectedSize.id === size.id && styles.optionLabelSelected,
                  ]}
                >
                  {size.label}
                </Text>
                <Text
                  style={[
                    styles.optionPrice,
                    selectedSize.id === size.id && styles.optionPriceSelected,
                  ]}
                >
                  ${size.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frame Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Frame</Text>
          <View style={styles.optionsGrid}>
            {FRAMES.map((frame) => (
              <TouchableOpacity
                key={frame.id}
                style={[
                  styles.optionCard,
                  selectedFrame.id === frame.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedFrame(frame)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    selectedFrame.id === frame.id && styles.optionLabelSelected,
                  ]}
                >
                  {frame.label}
                </Text>
                <Text
                  style={[
                    styles.optionPrice,
                    selectedFrame.id === frame.id && styles.optionPriceSelected,
                  ]}
                >
                  {frame.price === 0 ? 'Free' : `+$${frame.price}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Display */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.priceValue}>${calculatePrice().toFixed(2)}</Text>
        </View>

        {/* Add to Cart Button */}
        <Button
          title={addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
          onPress={handleAddToCart}
          disabled={!uploadedImageUrl || uploading || addingToCart}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  imageSection: {
    marginBottom: SPACING.xl,
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  placeholderText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  imageButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f5f0',
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionPrice: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  optionPriceSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
});
