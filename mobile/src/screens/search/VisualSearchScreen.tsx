import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { apiClient } from '@/lib/api/client';

interface VisualSearchScreenProps {
  navigation: any;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  price: number;
  similarity: number;
  style: string;
  colors: string[];
}

const VisualSearchScreen: React.FC<VisualSearchScreenProps> = ({ navigation }) => {
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filters = ['Similar Style', 'Similar Colors', 'Same Artist', 'Price Range'];

  const handleCameraSearch = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed for visual search.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSearchImage(result.assets[0].uri);
        performVisualSearch(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera search error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleGallerySearch = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Photo library access is needed for visual search.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSearchImage(result.assets[0].uri);
        performVisualSearch(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery search error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const performVisualSearch = async (imageUri: string) => {
    try {
      setIsSearching(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Call AI visual search API
      const response = await apiClient.post('/ai/visual-search', {
        imageUri,
        filters: selectedFilters,
      });

      setResults((response as any).data.results);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Visual search error:', error);
      Alert.alert('Search Failed', 'Unable to find similar artworks. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFilter = (filter: string) => {
    Haptics.selectionAsync();
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('ProductDetail', { productId: item.id });
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.similarityBadge}>
            <Text style={styles.similarityText}>
              {Math.round(item.similarity * 100)}% match
            </Text>
          </View>
        </View>
        <Text style={styles.resultArtist} numberOfLines={1}>
          {item.artist}
        </Text>
        <View style={styles.resultFooter}>
          <Text style={styles.resultPrice}>${item.price}</Text>
          <View style={styles.colorDots}>
            {item.colors.slice(0, 3).map((color, index) => (
              <View
                key={index}
                style={[styles.colorDot, { backgroundColor: color }]}
              />
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visual Search</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Actions */}
      {!searchImage && (
        <View style={styles.searchActions}>
          <View style={styles.searchPrompt}>
            <Ionicons name="camera" size={64} color={Colors.primary} />
            <Text style={styles.promptTitle}>Find Similar Artwork</Text>
            <Text style={styles.promptText}>
              Take a photo or upload an image to find similar art pieces
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCameraSearch}
            >
              <Ionicons name="camera" size={32} color={Colors.white} />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleGallerySearch}
            >
              <Ionicons name="images" size={32} color={Colors.white} />
              <Text style={styles.actionButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Image & Filters */}
      {searchImage && (
        <View style={styles.searchSection}>
          <View style={styles.searchImageContainer}>
            <Image source={{ uri: searchImage }} style={styles.searchImage} />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handleGallerySearch}
            >
              <Ionicons name="refresh" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.filtersContainer}>
            <Text style={styles.filtersLabel}>Refine Search:</Text>
            <View style={styles.filterChips}>
              {filters.map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    selectedFilters.includes(filter) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilters.includes(filter) && styles.filterChipTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing image...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : searchImage ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyStateText}>No similar artworks found</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
  },
  searchActions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  searchPrompt: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  promptTitle: {
    ...Typography.h2,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  promptText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 140,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  searchSection: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  searchImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    marginTop: Spacing.sm,
  },
  filtersLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  resultsList: {
    padding: Spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultImage: {
    width: 100,
    height: 100,
  },
  resultInfo: {
    flex: 1,
    padding: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  resultTitle: {
    ...Typography.h4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  similarityBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  similarityText: {
    ...Typography.caption,
    color: Colors.success,
    fontSize: 10,
  },
  resultArtist: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultPrice: {
    ...Typography.h4,
    color: Colors.primary,
  },
  colorDots: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});

export default VisualSearchScreen;

