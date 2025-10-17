import { createClient, Session, User, AuthError } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if running on web
const isWeb = Platform.OS === 'web';

// Custom storage adapter that uses localStorage on web and SecureStore on native
const StorageAdapter = {
  getItem: async (key: string) => {
    try {
      if (isWeb) {
        // Use localStorage on web
        return window.localStorage.getItem(key);
      } else {
        // Use SecureStore on native
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.warn('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (isWeb) {
        // Use localStorage on web
        window.localStorage.setItem(key, value);
      } else {
        // Use SecureStore on native
        if (value.length > 2048) {
          console.warn('SecureStore value too large, storing truncated version');
        }
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn('Storage setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (isWeb) {
        // Use localStorage on web
        window.localStorage.removeItem(key);
      } else {
        // Use SecureStore on native
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn('Storage removeItem error:', error);
    }
  },
};

// Create Supabase client with secure storage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for authentication
export const supabaseAuth = {
  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string): Promise<{ session: Session | null; error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { session: null, error };
      }

      // Store auth token for API client
      if (data.session?.access_token) {
        if (isWeb) {
          window.localStorage.setItem('auth_token', data.session.access_token);
        } else {
          await SecureStore.setItemAsync('auth_token', data.session.access_token);
        }
      }

      return { session: data.session, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        session: null, 
        error: error as AuthError 
      };
    }
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string): Promise<{ session: Session | null; error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { session: null, error };
      }

      // Store auth token for API client
      if (data.session?.access_token) {
        if (isWeb) {
          window.localStorage.setItem('auth_token', data.session.access_token);
        } else {
          await SecureStore.setItemAsync('auth_token', data.session.access_token);
        }
      }

      return { session: data.session, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        session: null, 
        error: error as AuthError 
      };
    }
  },

  /**
   * Resend confirmation email for signup
   */
  resendConfirmation: async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      return { error };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return { error: error as AuthError };
    }
  },

  /**
   * Request password reset email
   */
  resetPassword: async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const redirectTo = process.env.EXPO_PUBLIC_SUPABASE_RESET_REDIRECT_URL || undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    }
  },

  /**
   * Sign out current user
   */
  signOut: async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();

      // Clear auth token from storage
      if (isWeb) {
        window.localStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }

      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  },

  /**
   * Get current session
   */
  getSession: async (): Promise<Session | null> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        return null;
      }

      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  /**
   * Get current user
   */
  getUser: async (): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (session: Session | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update auth token in storage when session changes
        if (session?.access_token) {
          if (isWeb) {
            window.localStorage.setItem('auth_token', session.access_token);
          } else {
            await SecureStore.setItemAsync('auth_token', session.access_token);
          }
        } else {
          if (isWeb) {
            window.localStorage.removeItem('auth_token');
          } else {
            await SecureStore.deleteItemAsync('auth_token');
          }
        }

        callback(session);
      }
    );

    return subscription;
  },
};

export default supabase;
