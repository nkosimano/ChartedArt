import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseAuth } from '../lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const currentSession = await supabaseAuth.getSession();
        setSession(currentSession);
        
        if (currentSession) {
          const currentUser = await supabaseAuth.getUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const subscription = supabaseAuth.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setLoading(true);
      const { session: newSession, error } = await supabaseAuth.signIn(email, password);

      if (error) {
        return { error: error.message };
      }

      setSession(newSession);
      if (newSession) {
        const currentUser = await supabaseAuth.getUser();
        setUser(currentUser);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setLoading(true);
      const { session: newSession, error } = await supabaseAuth.signUp(email, password);

      if (error) {
        return { error: error.message };
      }

      setSession(newSession);
      if (newSession) {
        const currentUser = await supabaseAuth.getUser();
        setUser(currentUser);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabaseAuth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabaseAuth.resendConfirmation(email);
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return { error: 'Failed to resend confirmation email.' };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabaseAuth.resetPassword(email);
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'Failed to request password reset.' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    resendConfirmation,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
