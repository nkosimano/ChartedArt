import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const AccountScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Account Screen</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtext: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
});

export default AccountScreen;
