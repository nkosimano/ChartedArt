import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { apiClient } from '@/lib/api/client';

interface RoomAdvisorScreenProps {
  navigation: any;
}

interface RoomAnalysis {
  roomType: string;
  style: string;
  dominantColors: string[];
  lightingCondition: string;
  wallSpace: {
    width: number;
    height: number;
  };
  recommendations: {
    sizes: string[];
    styles: string[];
    colors: string[];
    placement: string;
  };
  suggestedArtworks: Array<{
    id: string;
    title: string;
    imageUrl: string;
    matchScore: number;
  }>;
}

const RoomAdvisorScreen: React.FC<RoomAdvisorScreenProps> = ({ navigation }) => {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);

  const handleCaptureRoom = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to analyze your room.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setRoomImage(result.assets[0].uri);
        analyzeRoom(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleSelectRoom = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Photo library access is needed to analyze your room.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setRoomImage(result.assets[0].uri);
        analyzeRoom(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const analyzeRoom = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Call AI room analysis API
      const response = await apiClient.post('/ai/analyze-room', {
        imageUri,
      });

      setAnalysis((response as any).data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Room analysis error:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze room. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderRecommendationChip = (label: string, icon: string) => (
    <View style={styles.recommendationChip}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text style={styles.recommendationChipText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Room Advisor</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Initial State */}
        {!roomImage && !analysis && (
          <View style={styles.initialState}>
            <View style={styles.iconContainer}>
              <Ionicons name="home" size={64} color={colors.primary} />
            </View>
            <Text style={styles.title}>Get Personalized Recommendations</Text>
            <Text style={styles.description}>
              Our AI will analyze your room's style, colors, and dimensions to suggest
              the perfect artwork and size for your space.
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCaptureRoom}
              >
                <Ionicons name="camera" size={24} color={colors.white} />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSelectRoom}
              >
                <Ionicons name="images" size={24} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing your room...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  initialState: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: colors.primary + '20',
    borderRadius: 50,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionButtons: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  loadingState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  recommendationChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recommendationChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RoomAdvisorScreen;