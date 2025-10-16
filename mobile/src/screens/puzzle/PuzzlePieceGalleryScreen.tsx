import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PuzzlePieceGrid, PuzzlePiece } from '../../components/puzzle/PuzzlePieceGrid';
import { ReservationCountdown } from '../../components/puzzle/ReservationCountdown';
import { usePuzzlePieces, useReservePuzzlePiece, useCancelReservation, useActiveReservation } from '../../hooks/usePuzzlePieces';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export const PuzzlePieceGalleryScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { movementId } = route.params as { movementId: string };
  
  const { pieces, totalPieces, isLoading } = usePuzzlePieces(movementId);
  const { reservePiece } = useReservePuzzlePiece();
  const { cancelReservation } = useCancelReservation();
  const { reservation } = useActiveReservation();
  
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  const scale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePiecePress = (piece: PuzzlePiece) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPiece(piece);
    setIsModalVisible(true);
  };

  const handleReserve = async () => {
    if (!selectedPiece) return;

    setIsReserving(true);
    try {
      await reservePiece(selectedPiece.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Reserved!',
        `Piece #${selectedPiece.number} is reserved for 15 minutes. Complete your purchase soon!`,
        [{ text: 'OK' }]
      );
      setIsModalVisible(false);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to reserve piece',
        [{ text: 'OK' }]
      );
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;

    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel your reservation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReservation(reservation.pieceId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel reservation');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout', { reservedPieceId: reservation?.pieceId });
  };

  const handleReservationExpire = () => {
    Alert.alert(
      'Reservation Expired',
      'Your reservation has expired. The piece is now available for others.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Puzzle Pieces</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Active Reservation */}
        {reservation && (
          <ReservationCountdown
            pieceNumber={reservation.pieceNumber}
            expiresAt={reservation.expiresAt}
            onExpire={handleReservationExpire}
            onCheckout={handleCheckout}
            onCancel={handleCancelReservation}
          />
        )}

        {/* Grid */}
        <PuzzlePieceGrid
          pieces={pieces}
          totalPieces={totalPieces}
          onPiecePress={handlePiecePress}
        />

        {/* Detail Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>

              {selectedPiece && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <PinchGestureHandler onGestureEvent={pinchHandler}>
                    <Animated.View style={[styles.imageContainer, animatedStyle]}>
                      <Image
                        source={{ uri: selectedPiece.imageUrl }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  </PinchGestureHandler>

                  <View style={styles.modalInfo}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        Puzzle Piece #{selectedPiece.number}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          selectedPiece.status === 'available'
                            ? styles.statusAvailable
                            : selectedPiece.status === 'reserved'
                            ? styles.statusReserved
                            : styles.statusSold,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {selectedPiece.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.modalSubtitle}>
                      Part {selectedPiece.number} of {totalPieces}
                    </Text>

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Price</Text>
                      <Text style={styles.price}>${selectedPiece.price}</Text>
                    </View>

                    {selectedPiece.status === 'available' && (
                      <>
                        <View style={styles.infoBox}>
                          <Ionicons name="information-circle" size={20} color="#3B82F6" />
                          <Text style={styles.infoText}>
                            Reserve this piece for 15 minutes to complete your purchase
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.reserveButton, isReserving && styles.reserveButtonDisabled]}
                          onPress={handleReserve}
                          disabled={isReserving}
                          activeOpacity={0.8}
                        >
                          {isReserving ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Ionicons name="cart" size={20} color="#fff" />
                              <Text style={styles.reserveButtonText}>
                                Reserve for ${selectedPiece.price}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  imageContainer: {
    width: width,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalInfo: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#D1FAE5',
  },
  statusReserved: {
    backgroundColor: '#FEF3C7',
  },
  statusSold: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  priceContainer: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  reserveButtonDisabled: {
    opacity: 0.6,
  },
  reserveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
