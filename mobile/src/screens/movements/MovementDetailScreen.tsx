import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MovementDetailHeader } from '../../components/movements/MovementDetailHeader';
import { JoinMovementButton } from '../../components/movements/JoinMovementButton';
import { DonationSheet } from '../../components/movements/DonationSheet';
import { useMovement, useJoinMovement, useIsMovementParticipant } from '../../hooks/useMovements';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const MovementDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { slug } = route.params as { slug: string };
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const { movement, isLoading, error } = useMovement(slug);
  const { isParticipant } = useIsMovementParticipant(movement?.id || '');
  const { joinMovement } = useJoinMovement();
  
  const [isDonationSheetOpen, setIsDonationSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !movement) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Movement not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleJoin = async (movementId: string) => {
    await joinMovement(movementId);
  };

  const handleDonate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDonationSheetOpen(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this movement: ${movement.title}`,
        url: `https://chartedart.com/movements/${movement.slug}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDonationSuccess = (amount: number) => {
    Alert.alert(
      'Thank you!',
      `Your $${amount} donation has been processed successfully.`,
      [{ text: 'OK' }]
    );
  };

  const handlePuzzlePieces = () => {
    navigation.navigate('PuzzlePieceGallery', { movementId: movement.id });
  };

  return (
    <View style={styles.container}>
      <MovementDetailHeader
        title={movement.title}
        bannerImage={movement.banner_image}
        goalAmount={movement.goal_amount}
        currentAmount={movement.current_amount}
        participantCount={movement.participant_count}
        endDate={movement.end_date}
        scrollY={scrollY}
        onShare={handleShare}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.donateButton}
            onPress={handleDonate}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={20} color="#fff" />
            <Text style={styles.donateButtonText}>Donate Now</Text>
          </TouchableOpacity>

          <JoinMovementButton
            movementId={movement.id}
            isJoined={isParticipant}
            onJoin={handleJoin}
            style={styles.joinButton}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Movement</Text>
          <Text style={styles.description}>
            {movement.long_description || movement.description}
          </Text>
        </View>

        {/* Puzzle Pieces Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Puzzle Pieces</Text>
            <TouchableOpacity onPress={handlePuzzlePieces}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Collect unique pieces of exclusive artwork from this movement
          </Text>
          <TouchableOpacity
            style={styles.puzzleButton}
            onPress={handlePuzzlePieces}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={24} color="#3B82F6" />
            <Text style={styles.puzzleButtonText}>Browse Puzzle Pieces</Text>
          </TouchableOpacity>
        </View>

        {/* Impact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.impactCard}>
            <Ionicons name="people" size={32} color="#3B82F6" />
            <Text style={styles.impactText}>
              Join {movement.participant_count.toLocaleString()} supporters making a difference
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      <DonationSheet
        isOpen={isDonationSheetOpen}
        onClose={() => setIsDonationSheetOpen(false)}
        movementId={movement.id}
        movementTitle={movement.title}
        onSuccess={handleDonationSuccess}
      />
    </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  donateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  donateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  puzzleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  puzzleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 12,
  },
  impactText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});
