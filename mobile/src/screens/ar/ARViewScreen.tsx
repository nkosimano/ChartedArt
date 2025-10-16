import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GLView } from 'expo-gl';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';

interface ARViewScreenProps {
  navigation: any;
  route: {
    params: {
      artworkId: string;
      artworkTitle: string;
      artworkImage: string;
    };
  };
}

const ARViewScreen: React.FC<ARViewScreenProps> = ({ navigation, route }) => {
  const { artworkId, artworkTitle, artworkImage } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaced, setIsPlaced] = useState(false);
  const [lightingEnabled, setLightingEnabled] = useState(true);
  const glViewRef = useRef<GLView>(null);

  const handlePlaceArtwork = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsPlaced(true);
      
      // Here you would implement ARKit placement logic
      Alert.alert('Artwork Placed!', 'Tap and drag to reposition, pinch to resize');
    } catch (error) {
      console.error('AR placement error:', error);
      Alert.alert('Error', 'Failed to place artwork in AR');
    }
  };

  const handleCapture = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Here you would implement screenshot capture
      Alert.alert('Screenshot Saved!', 'Your AR preview has been saved to Photos');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
    }
  };

  const handleAddToCart = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Add to cart logic here
      Alert.alert('Added to Cart!', `${artworkTitle} has been added to your cart`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const onGLContextCreate = async (gl: WebGLRenderingContext) => {
    try {
      // Initialize AR context here
      setIsLoading(false);
    } catch (error) {
      console.error('GL context error:', error);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* AR View */}
      <GLView
        ref={glViewRef}
        style={styles.glView}
        onContextCreate={onGLContextCreate}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Initializing AR...</Text>
        </View>
      )}

      {/* Instructions */}
      {!isLoading && !isPlaced && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.scanIndicator}>
            <Ionicons name="scan" size={48} color={colors.primary} />
          </View>
          <Text style={styles.instructionsTitle}>Find a Wall</Text>
          <Text style={styles.instructionsText}>
            Slowly move your device to detect a wall surface
          </Text>
        </View>
      )}

      {/* Header Controls */}
      <View style={styles.headerControls}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.lightingButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLightingEnabled(!lightingEnabled);
          }}
        >
          <Ionicons name="bulb" size={16} color={colors.white} />
          <Text style={styles.lightingText}>
            {lightingEnabled ? 'Realistic' : 'Bright'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <Ionicons name="camera" size={24} color={colors.white} />
        </TouchableOpacity>

        {!isPlaced ? (
          <TouchableOpacity
            style={styles.placeButton}
            onPress={handlePlaceArtwork}
          >
            <Ionicons name="add-circle" size={24} color={colors.white} />
            <Text style={styles.placeButtonText}>Place Artwork</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placedControls}>
            <TouchableOpacity style={styles.moveButton}>
              <Ionicons name="move" size={20} color={colors.primary} />
              <Text style={styles.controlText}>Move</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart" size={20} color={colors.white} />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.sizeButton}>
          <Ionicons name="resize" size={16} color={colors.white} />
          <Text style={styles.sizeText}>Size</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  glView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  instructionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIndicator: {
    backgroundColor: colors.white,
    borderRadius: 50,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.md,
  },
  instructionsText: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  headerControls: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: spacing.sm,
  },
  lightingButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lightingText: {
    ...typography.caption,
    color: colors.white,
  },
  bottomControls: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  captureButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeButtonText: {
    ...typography.buttonLarge,
    color: colors.white,
  },
  placedControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  moveButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlText: {
    ...typography.button,
    color: colors.primary,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addToCartText: {
    ...typography.button,
    color: colors.white,
  },
  sizeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    left: spacing.md,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sizeText: {
    ...typography.caption,
    color: colors.white,
  },
});

export default ARViewScreen;