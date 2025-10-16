import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface BiometricCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_type: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

interface AuthenticationResult {
  success: boolean;
  user?: any;
  error?: string;
  requiresPasswordFallback?: boolean;
}

interface RegistrationResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [hasRegisteredCredentials, setHasRegisteredCredentials] = useState<boolean>(false);

  useEffect(() => {
    checkBiometricSupport();
    loadUserCredentials();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        setIsSupported(false);
        return;
      }

      // Check available authenticator methods
      const methods: string[] = [];
      
      // Check platform authenticator (Face ID, Touch ID, Windows Hello)
      const platformSupported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (platformSupported) {
        methods.push('platform');
      }

      // Check external authenticators (USB keys, etc.)
      methods.push('cross-platform');

      setIsSupported(methods.length > 0);
      setAvailableMethods(methods);

      console.log('[BiometricAuth] Support check completed:', {
        supported: methods.length > 0,
        methods
      });
    } catch (error) {
      console.error('[BiometricAuth] Support check failed:', error);
      setIsSupported(false);
    }
  };

  const loadUserCredentials = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: credentials, error } = await supabase
        .from('user_biometric_credentials')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      setHasRegisteredCredentials(credentials && credentials.length > 0);
    } catch (error) {
      console.error('[BiometricAuth] Failed to load credentials:', error);
    }
  };

  const registerBiometric = useCallback(async (
    deviceName?: string,
    preferredAuthenticator: 'platform' | 'cross-platform' = 'platform'
  ): Promise<RegistrationResult> => {
    if (!isSupported) {
      return { success: false, error: 'Biometric authentication not supported' };
    }

    setIsRegistering(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User must be logged in' };
      }

      // Generate challenge from server
      const challengeResponse = await fetch('/api/webauthn/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email,
          authenticatorSelection: {
            authenticatorAttachment: preferredAuthenticator,
            userVerification: 'preferred',
            requireResidentKey: false,
          }
        }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to begin registration');
      }

      const challengeData = await challengeResponse.json();

      // Create WebAuthn credential
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64ToArrayBuffer(challengeData.challenge),
        rp: {
          name: 'ChartedArt',
          id: window.location.hostname,
        },
        user: {
          id: stringToArrayBuffer(session.user.id),
          name: session.user.email!,
          displayName: session.user.user_metadata?.full_name || session.user.email!,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: preferredAuthenticator,
          userVerification: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'direct',
        excludeCredentials: challengeData.excludeCredentials?.map((cred: any) => ({
          id: base64ToArrayBuffer(cred.id),
          type: 'public-key',
        })) || [],
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const clientDataJSON = arrayBufferToBase64(response.clientDataJSON);
      const attestationObject = arrayBufferToBase64(response.attestationObject);

      // Verify registration with server
      const verifyResponse = await fetch('/api/webauthn/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          rawId: arrayBufferToBase64(credential.rawId),
          response: {
            clientDataJSON,
            attestationObject,
          },
          type: credential.type,
          challenge: challengeData.challenge,
          origin: window.location.origin,
          device_name: deviceName || getDeviceName(),
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Registration verification failed');
      }

      const verificationResult = await verifyResponse.json();

      if (!verificationResult.verified) {
        throw new Error('Credential verification failed');
      }

      // Store credential in database
      const { data: storedCredential, error: storeError } = await supabase
        .from('user_biometric_credentials')
        .insert({
          user_id: session.user.id,
          credential_id: credential.id,
          public_key: verificationResult.publicKey,
          counter: verificationResult.counter,
          device_type: preferredAuthenticator,
          device_name: deviceName || getDeviceName(),
        })
        .select()
        .single();

      if (storeError) throw storeError;

      setHasRegisteredCredentials(true);

      console.log('[BiometricAuth] Registration successful');

      return {
        success: true,
        credential: storedCredential,
      };

    } catch (error: any) {
      console.error('[BiometricAuth] Registration failed:', error);
      
      let errorMessage = 'Registration failed';
      if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication not supported on this device';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled or denied';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'This device is already registered';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsRegistering(false);
    }
  }, [isSupported]);

  const authenticateWithBiometric = useCallback(async (
    purpose: 'login' | 'payment' | 'sensitive_action' = 'login'
  ): Promise<AuthenticationResult> => {
    if (!isSupported) {
      return { success: false, error: 'Biometric authentication not supported' };
    }

    if (!hasRegisteredCredentials) {
      return { success: false, error: 'No biometric credentials registered' };
    }

    setIsAuthenticating(true);

    try {
      // Get challenge from server
      const challengeResponse = await fetch('/api/webauthn/authenticate/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to begin authentication');
      }

      const challengeData = await challengeResponse.json();

      // Create authentication request
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64ToArrayBuffer(challengeData.challenge),
        timeout: 60000,
        rpId: window.location.hostname,
        allowCredentials: challengeData.allowCredentials.map((cred: any) => ({
          id: base64ToArrayBuffer(cred.id),
          type: 'public-key',
          transports: cred.transports,
        })),
        userVerification: 'preferred',
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Authentication failed');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      const clientDataJSON = arrayBufferToBase64(response.clientDataJSON);
      const authenticatorData = arrayBufferToBase64(response.authenticatorData);
      const signature = arrayBufferToBase64(response.signature);
      const userHandle = response.userHandle ? arrayBufferToBase64(response.userHandle) : null;

      // Verify authentication with server
      const verifyResponse = await fetch('/api/webauthn/authenticate/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assertion.id,
          rawId: arrayBufferToBase64(assertion.rawId),
          response: {
            clientDataJSON,
            authenticatorData,
            signature,
            userHandle,
          },
          type: assertion.type,
          challenge: challengeData.challenge,
          origin: window.location.origin,
          purpose,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Authentication verification failed');
      }

      const verificationResult = await verifyResponse.json();

      if (!verificationResult.verified) {
        throw new Error('Authentication verification failed');
      }

      // Update credential usage
      await supabase
        .from('user_biometric_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('credential_id', assertion.id);

      console.log('[BiometricAuth] Authentication successful');

      return {
        success: true,
        user: verificationResult.user,
      };

    } catch (error: any) {
      console.error('[BiometricAuth] Authentication failed:', error);

      let errorMessage = 'Authentication failed';
      let requiresPasswordFallback = false;

      if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication not supported';
        requiresPasswordFallback = true;
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Authentication was cancelled or denied';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'No valid credentials found';
        requiresPasswordFallback = true;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        requiresPasswordFallback,
      };
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported, hasRegisteredCredentials]);

  const removeCredential = useCallback(async (credentialId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_biometric_credentials')
        .delete()
        .eq('credential_id', credentialId);

      if (error) throw error;

      // Check if user still has other credentials
      await loadUserCredentials();

      console.log('[BiometricAuth] Credential removed successfully');
      return true;
    } catch (error) {
      console.error('[BiometricAuth] Failed to remove credential:', error);
      return false;
    }
  }, []);

  const getRegisteredDevices = useCallback(async (): Promise<BiometricCredential[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data: credentials, error } = await supabase
        .from('user_biometric_credentials')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return credentials || [];
    } catch (error) {
      console.error('[BiometricAuth] Failed to get registered devices:', error);
      return [];
    }
  }, []);

  // Convenience method for payment confirmation
  const confirmPaymentWithBiometric = useCallback(async (paymentData: {
    amount: number;
    currency: string;
    merchant?: string;
  }): Promise<AuthenticationResult> => {
    return authenticateWithBiometric('payment');
  }, [authenticateWithBiometric]);

  return {
    // Support status
    isSupported,
    availableMethods,
    hasRegisteredCredentials,

    // Loading states
    isRegistering,
    isAuthenticating,

    // Main methods
    registerBiometric,
    authenticateWithBiometric,
    confirmPaymentWithBiometric,

    // Management
    removeCredential,
    getRegisteredDevices,
    loadUserCredentials,
  };
}

// Utility functions
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/Android/.test(userAgent)) return 'Android Device';
  if (/Mac/.test(userAgent)) return 'Mac';
  if (/Windows/.test(userAgent)) return 'Windows PC';
  if (/Linux/.test(userAgent)) return 'Linux Device';
  
  return 'Unknown Device';
}