import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import apiClient from '../../lib/api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GalleryItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  size: string;
  frame: string;
  created_at: string;
}

interface GalleryScreenProps {
  navigation: any;
}

export default function GalleryScreen({ navigation }: GalleryScreenProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      // Load cached gallery first for quick display
      const cached = await AsyncStorage.getItem('cache:gallery');
      if (cached) {
        try { setGalleryItems(JSON.parse(cached)); } catch {}
      }
      await fetchGallery();
    })();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ items: GalleryItem[] }>('/gallery');
      const items = response.items || [];
      setGalleryItems(items);
      // Cache items for offline/next launch
      await AsyncStorage.setItem('cache:gallery', JSON.stringify(items));
    } catch (error) {
      console.error('Error fetching gallery:', error);
      Alert.alert('Error', 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGallery();
    setRefreshing(false);
  };

  const handleItemPress = (item: GalleryItem) => {
    Alert.alert(
      item.name,
      `Size: ${item.size}\nFrame: ${item.frame}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reorder',
          onPress: () => handleReorder(item),
        },
      ]
    );
  };

  const handleReorder = async (item: GalleryItem) => {
    try {
      await apiClient.post('/cart', {
        imageUrl: item.image_url,
        name: item.name,
        size: item.size,
        frame: item.frame,
        price: 0, // Price will be calculated on backend
        quantity: 1,
      });

      Alert.alert('Added to Cart', 'Item has been added to your cart!', [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('Cart'),
        },
      ]);
    } catch (error) {
      console.error('Error reordering:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const renderItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={styles.itemOverlay}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (galleryItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Items Yet</Text>
        <Text style={styles.emptyText}>
          Your gallery will show all your created prints
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={galleryItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: SPACING.sm,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
