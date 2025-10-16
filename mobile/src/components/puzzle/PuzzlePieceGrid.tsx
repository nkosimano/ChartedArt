import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3; // 3 columns with padding

export type PuzzlePieceStatus = 'available' | 'reserved' | 'sold';

export interface PuzzlePiece {
  id: string;
  number: number;
  imageUrl: string;
  status: PuzzlePieceStatus;
  price: number;
  reservedUntil?: string;
}

export interface PuzzlePieceGridProps {
  pieces: PuzzlePiece[];
  totalPieces: number;
  onPiecePress: (piece: PuzzlePiece) => void;
}

const statusConfig = {
  available: {
    label: 'Available',
    color: '#10B981',
    icon: null,
  },
  reserved: {
    label: 'Reserved',
    color: '#F59E0B',
    icon: 'time' as const,
  },
  sold: {
    label: 'Sold',
    color: '#6B7280',
    icon: 'checkmark-circle' as const,
  },
};

export const PuzzlePieceGrid: React.FC<PuzzlePieceGridProps> = ({
  pieces,
  totalPieces,
  onPiecePress,
}) => {
  const availableCount = pieces.filter(p => p.status === 'available').length;
  const soldCount = pieces.filter(p => p.status === 'sold').length;
  const reservedCount = pieces.filter(p => p.status === 'reserved').length;

  const renderItem = ({ item }: { item: PuzzlePiece }) => {
    const config = statusConfig[item.status];
    const isClickable = item.status === 'available';

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => isClickable && onPiecePress(item)}
        disabled={!isClickable}
        activeOpacity={0.7}
      >
        <View style={styles.item}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {!isClickable && (
            <View style={styles.overlay}>
              <Ionicons name="lock-closed" size={24} color="#fff" />
            </View>
          )}

          <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
            {config.icon && (
              <Ionicons name={config.icon} size={10} color="#fff" />
            )}
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.number}>#{item.number}</Text>
          {item.status === 'available' && (
            <Text style={styles.price}>${item.price}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <View style={[styles.statIndicator, { backgroundColor: '#10B981' }]} />
          <Text style={styles.statValue}>{availableCount}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={[styles.statIndicator, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.statValue}>{reservedCount}</Text>
          <Text style={styles.statLabel}>Reserved</Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={[styles.statIndicator, { backgroundColor: '#6B7280' }]} />
          <Text style={styles.statValue}>{soldCount}</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={pieces}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No puzzle pieces available yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  grid: {
    paddingHorizontal: 8,
  },
  itemContainer: {
    width: ITEM_SIZE,
    padding: 4,
    marginBottom: 8,
  },
  item: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  number: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  price: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
