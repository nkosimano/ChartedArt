import { createClient, Session, User, AuthError } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for expo-secure-store
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client with secure storage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
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
        await SecureStore.setItemAsync('auth_token', data.session.access_token);
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
        await SecureStore.setItemAsync('auth_token', data.session.access_token);
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
   * Sign out current user
   */
  signOut: async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();

      // Clear auth token from secure storage
      await SecureStore.deleteItemAsync('auth_token');

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
        // Update auth token in secure storage when session changes
        if (session?.access_token) {
          await SecureStore.setItemAsync('auth_token', session.access_token);
        } else {
          await SecureStore.deleteItemAsync('auth_token');
        }

        callback(session);
      }
    );

    return subscription;
  },
};

export default supabase;
