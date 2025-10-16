import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  changes?: any;
  status: 'success' | 'failed' | 'blocked';
  created_at: string;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  admin_user_id?: string;
  details: any;
  is_resolved: boolean;
  created_at: string;
}

interface MFAEnrollment {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

/**
 * Hook for admin security features
 */
export const useAdminSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Log an admin action for audit trail
   */
  const logAction = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    changes?: any
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!adminUser) return;

      await supabase.from('admin_audit_log').insert({
        admin_user_id: adminUser.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
        status: 'success'
      });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  }, []);

  /**
   * Get audit logs
   */
  const getAuditLogs = useCallback(async (
    filters?: {
      adminUserId?: string;
      action?: string;
      resourceType?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ) => {
    try {
      setLoading(true);
      let query = supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin_users!admin_audit_log_admin_user_id_fkey(
            id,
            role,
            profiles!admin_users_user_id_fkey(email, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AdminAuditLog[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get security alerts
   */
  const getSecurityAlerts = useCallback(async (
    unresolvedOnly: boolean = true
  ) => {
    try {
      setLoading(true);
      let query = supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (unresolvedOnly) {
        query = query.eq('is_resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SecurityAlert[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security alerts');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Resolve a security alert
   */
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!adminUser) throw new Error('Not an admin user');

      const { error } = await supabase
        .from('security_alerts')
        .update({
          is_resolved: true,
          resolved_by: adminUser.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      await logAction('resolve_alert', 'security_alert', alertId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logAction]);

  /**
   * Track login attempt
   */
  const trackLoginAttempt = useCallback(async (
    email: string,
    success: boolean,
    failureReason?: string
  ) => {
    try {
      await supabase.from('login_attempts').insert({
        email,
        success,
        failure_reason: failureReason
      });

      // Check for brute force
      if (!success) {
        const { data, error } = await supabase.rpc('check_brute_force', {
          p_email: email
        });

        if (error) throw error;

        if (data) {
          // Create security alert
          await supabase.rpc('create_security_alert', {
            p_alert_type: 'failed_login_attempts',
            p_severity: 'high',
            p_details: { email, attempts: 5 }
          });
        }
      }
    } catch (err) {
      console.error('Failed to track login attempt:', err);
    }
  }, []);

  /**
   * Update last login info
   */
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({
          last_login_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update last login:', err);
    }
  }, []);

  return {
    loading,
    error,
    logAction,
    getAuditLogs,
    getSecurityAlerts,
    resolveAlert,
    trackLoginAttempt,
    updateLastLogin
  };
};

/**
 * Hook for MFA (Multi-Factor Authentication)
 */
export const useMFA = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Enroll in MFA
   */
  const enrollMFA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'ChartedArt Admin'
      });

      if (error) throw error;

      return data as MFAEnrollment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enroll in MFA';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify MFA enrollment
   */
  const verifyMFA = useCallback(async (factorId: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code
      });

      if (error) throw error;

      // Update admin_users table
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('admin_users')
          .update({ mfa_enabled: true })
          .eq('user_id', session.user.id);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify MFA code';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Unenroll from MFA
   */
  const unenrollMFA = useCallback(async (factorId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      // Update admin_users table
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('admin_users')
          .update({ mfa_enabled: false })
          .eq('user_id', session.user.id);

        // Create security alert
        await supabase.rpc('create_security_alert', {
          p_alert_type: 'mfa_disabled',
          p_severity: 'high',
          p_details: { user_id: session.user.id }
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unenroll from MFA';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get MFA factors
   */
  const getMFAFactors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get MFA factors';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    getMFAFactors
  };
};

/**
 * Hook for session timeout management
 */
export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeoutMinutes * 60);

  useEffect(() => {
    let warningTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
      setShowWarning(false);
      setTimeRemaining(timeoutMinutes * 60);

      // Show warning 5 minutes before logout
      const warningTime = (timeoutMinutes - 5) * 60 * 1000;
      warningTimer = setTimeout(() => {
        setShowWarning(true);
        
        // Start countdown
        countdownInterval = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningTime);

      // Auto logout
      logoutTimer = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth/login?timeout=true';
      }, timeoutMinutes * 60 * 1000);
    };

    // Reset on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimers);
    });

    resetTimers();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
      events.forEach(event => {
        document.removeEventListener(event, resetTimers);
      });
    };
  }, [timeoutMinutes]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    setTimeRemaining(timeoutMinutes * 60);
    // Trigger a user activity event to reset timers
    document.dispatchEvent(new Event('mousedown'));
  }, [timeoutMinutes]);

  return {
    showWarning,
    timeRemaining,
    extendSession
  };
};

/**
 * Hook for IP whitelist management
 */
export const useIPWhitelist = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWhitelist = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_ip_whitelist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IP whitelist');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addIP = useCallback(async (ipAddress: string, description: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!adminUser) throw new Error('Not an admin user');

      const { error } = await supabase
        .from('admin_ip_whitelist')
        .insert({
          ip_address: ipAddress,
          description,
          added_by: adminUser.id
        });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add IP to whitelist');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeIP = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove IP from whitelist');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getWhitelist,
    addIP,
    removeIP
  };
};
