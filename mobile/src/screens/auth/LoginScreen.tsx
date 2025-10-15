import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { signIn, loading, resendConfirmation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const handleLogin = async () => {
    // Clear previous errors
    setError('');

    // Validate inputs
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error: signInError } = await signIn(email.trim(), password);

      if (signInError) {
        setError(signInError);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  if (loading && !isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>

            {error ? (
              <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <Button
              title={isSubmitting ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isSubmitting}
              style={styles.loginButton}
            />

            <TouchableOpacity onPress={navigateToForgotPassword} disabled={isSubmitting} style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={async () => {
                if (!email.trim()) {
                  Alert.alert('Enter Email', 'Please enter your email above to resend the confirmation email.');
                  return;
                }
                const { error } = await resendConfirmation(email.trim());
                if (error) {
                  Alert.alert('Resend Failed', error);
                } else {
                  Alert.alert('Email Sent', 'If an account exists for this email, a confirmation message has been sent.');
                }
              }} 
              disabled={isSubmitting}
              style={styles.resendContainer}
            >
              <Text style={styles.resendText}>Resend confirmation email</Text>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToSignUp} disabled={isSubmitting}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: '#c00',
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
  },
  loginButton: {
    marginBottom: SPACING.lg,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  resendText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },
});

export default LoginScreen;
