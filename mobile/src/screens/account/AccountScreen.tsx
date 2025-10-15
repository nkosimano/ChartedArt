import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { LINKS } from '../../config/links';
import { openExternal } from '../../lib/web/openExternal';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

interface AccountScreenProps {
  navigation: any;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<UserProfile>('/profile');
      setProfile(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use user data from auth context as fallback
      if (user) {
        setProfile({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at || new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'images-outline',
      title: 'My Gallery',
      subtitle: 'View your created prints',
      onPress: () => navigation.navigate('Gallery'),
    },
    {
      icon: 'receipt-outline',
      title: 'Order History',
      subtitle: 'Track your orders',
      onPress: () => navigation.navigate('OrderHistory'),
    },
    {
      icon: 'newspaper-outline',
      title: 'Blog',
      subtitle: 'Stories, tips and updates',
      onPress: () => openExternal(LINKS.BLOG),
    },
    {
      icon: 'calendar-outline',
      title: 'Events',
      subtitle: 'Workshops and community',
      onPress: () => openExternal(LINKS.EVENTS),
    },
    {
      icon: 'help-circle-outline',
      title: 'FAQ',
      subtitle: 'Answers to common questions',
      onPress: () => openExternal(LINKS.FAQ),
    },
    {
      icon: 'cube-outline',
      title: 'Shipping & Returns',
      subtitle: 'Policies and timelines',
      onPress: () => openExternal(LINKS.SHIPPING),
    },
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your information',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Support',
      subtitle: 'Get help from our team',
      onPress: () => navigation.navigate('Support'),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.name}>{profile?.name || 'User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </Card>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <Button
        title="Logout"
        onPress={handleLogout}
        style={styles.logoutButton}
      />

      {/* App Version */}
      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  menuSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    marginBottom: SPACING.lg,
  },
  version: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AccountScreen;
