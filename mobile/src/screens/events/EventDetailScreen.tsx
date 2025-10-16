import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../../lib/api/client';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  registration_deadline: string;
  entry_fee?: number;
  prize_pool?: number;
  cover_image?: string;
  location?: string;
  capacity?: number;
  rules_and_guidelines?: string;
  prizes?: Array<{ place: number; amount: number; description: string }>;
  status: string;
}

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { eventId } = route.params as { eventId: string };

  const [event, setEvent] = useState<Event | null>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the API
      const response = await apiClient.get<{ event: Event }>(`/events/${eventId}`);
      setEvent(response.event);

      // Check if user is registered (mock for now)
      // In production, this would be a real API call
      setUserRegistration(null);
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to register for this event');
      return;
    }

    try {
      setRegistering(true);
      // In production, this would call the real API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Registration Successful',
        'You have been registered for this event!',
        [{ text: 'OK', onPress: () => fetchEventDetails() }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmit = () => {
    navigation.navigate('EventSubmission' as never, { eventId } as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const eventDate = new Date(event.event_date);
  const registrationDeadline = new Date(event.registration_deadline);
  const now = new Date();
  const canRegister = now < registrationDeadline && !userRegistration;
  const canSubmit = userRegistration && event.event_type === 'competition' && now < eventDate;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Cover Image */}
        <View style={styles.imageContainer}>
          {event.cover_image ? (
            <Image source={{ uri: event.cover_image }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.placeholderImage]}>
              <Ionicons name="calendar" size={80} color={COLORS.border} />
            </View>
          )}
          <View style={styles.imageOverlay} />
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Event Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Registration Status */}
          {userRegistration && (
            <View style={styles.registrationBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.registrationTitle}>You're Registered!</Text>
                <Text style={styles.registrationText}>
                  {canSubmit && 'You can now submit your artwork for the competition.'}
                </Text>
              </View>
              {canSubmit && (
                <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Title and Description */}
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Event Info */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Event Information</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Event Date</Text>
                <Text style={styles.infoValue}>
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Registration Deadline</Text>
                <Text style={styles.infoValue}>
                  {registrationDeadline.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {event.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{event.location}</Text>
                </View>
              </View>
            )}

            {event.capacity && (
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Capacity</Text>
                  <Text style={styles.infoValue}>{event.capacity} participants</Text>
                </View>
              </View>
            )}

            {event.entry_fee !== undefined && event.entry_fee > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Entry Fee</Text>
                  <Text style={styles.infoValue}>R{event.entry_fee.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {event.prize_pool && (
              <View style={styles.infoRow}>
                <Ionicons name="trophy-outline" size={20} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Total Prize Pool</Text>
                  <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '700' }]}>
                    R{event.prize_pool.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Rules and Guidelines */}
          {event.rules_and_guidelines && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rules & Guidelines</Text>
              <Text style={styles.sectionText}>{event.rules_and_guidelines}</Text>
            </View>
          )}

          {/* Prizes */}
          {event.prizes && event.prizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prizes</Text>
              {event.prizes.map((prize, index) => (
                <View key={index} style={styles.prizeRow}>
                  <Text style={styles.prizePlace}>
                    {prize.place === 1 ? '🥇' : prize.place === 2 ? '🥈' : prize.place === 3 ? '🥉' : `#${prize.place}`}
                  </Text>
                  <Text style={styles.prizeDescription}>{prize.description}</Text>
                  <Text style={styles.prizeAmount}>R{prize.amount.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Register Button */}
      {canRegister && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.registerButton, registering && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={registering}
          >
            {registering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Register Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {canSubmit && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.registerButton} onPress={handleSubmit}>
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.registerButtonText}>Submit Entry</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.lg,
  },
  registrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  registrationTitle: {
    ...TYPOGRAPHY.h4,
    color: '#065F46',
  },
  registrationText: {
    ...TYPOGRAPHY.caption,
    color: '#047857',
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  prizePlace: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  prizeDescription: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  prizeAmount: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '700',
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  registerButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  registerButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
});

