import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabase } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      id,
      rawId,
      response,
      type,
      challenge,
      origin,
      purpose = 'login'
    } = req.body;

    // Verify origin
    const expectedOrigin = process.env.NODE_ENV === 'production' 
      ? 'https://chartedart.com' 
      : 'http://localhost:3000';

    if (origin !== expectedOrigin) {
      return res.status(400).json({ error: 'Invalid origin' });
    }

    // Find and validate challenge
    const challengeData = findChallenge(challenge);
    if (!challengeData || challengeData.purpose !== purpose) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    // Get credential from database
    const { data: credential, error: credentialError } = await supabase
      .from('user_biometric_credentials')
      .select('*')
      .eq('credential_id', id)
      .single();

    if (credentialError || !credential) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    // Convert stored public key from base64
    const publicKey = Buffer.from(credential.public_key, 'base64');

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: {
        id,
        rawId,
        response: {
          clientDataJSON: response.clientDataJSON,
          authenticatorData: response.authenticatorData,
          signature: response.signature,
          userHandle: response.userHandle,
        },
        type,
      },
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: process.env.NODE_ENV === 'production' ? 'chartedart.com' : 'localhost',
      authenticator: {
        credentialID: Buffer.from(credential.credential_id, 'base64'),
        credentialPublicKey: publicKey,
        counter: credential.counter,
        transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      },
      requireUserVerification: purpose === 'payment',
    });

    if (!verification.verified) {
      return res.status(400).json({ 
        error: 'Authentication verification failed',
        verified: false 
      });
    }

    // Update credential counter
    const { newCounter } = verification.authenticationInfo;
    await supabase
      .from('user_biometric_credentials')
      .update({ 
        counter: newCounter,
        last_used_at: new Date().toISOString()
      })
      .eq('credential_id', id);

    // Get user information
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(credential.user_id);
    
    if (userError || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Clean up challenge
    removeChallenge(challenge);

    // Log authentication event
    await supabase.from('user_authentication_logs').insert({
      user_id: credential.user_id,
      authentication_method: 'biometric',
      device_type: credential.device_type,
      purpose,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      success: true,
    });

    res.json({
      verified: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        user_metadata: user.user.user_metadata,
      },
      authenticationInfo: verification.authenticationInfo,
    });

  } catch (error) {
    console.error('[WebAuthn] Authentication finish error:', error);

    // Log failed authentication attempt
    try {
      const { data: credential } = await supabase
        .from('user_biometric_credentials')
        .select('user_id, device_type')
        .eq('credential_id', req.body.id)
        .single();

      if (credential) {
        await supabase.from('user_authentication_logs').insert({
          user_id: credential.user_id,
          authentication_method: 'biometric',
          device_type: credential.device_type,
          purpose: req.body.purpose || 'login',
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          success: false,
          error_message: error.message,
        });
      }
    } catch (logError) {
      console.error('[WebAuthn] Failed to log authentication attempt:', logError);
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

function findChallenge(challenge: string) {
  if (!global.webauthnChallenges) return null;
  
  for (const [key, data] of global.webauthnChallenges.entries()) {
    if (data.challenge === challenge && data.expires > Date.now()) {
      return data;
    }
  }
  return null;
}

function removeChallenge(challenge: string) {
  if (!global.webauthnChallenges) return;
  
  for (const [key, data] of global.webauthnChallenges.entries()) {
    if (data.challenge === challenge) {
      global.webauthnChallenges.delete(key);
      break;
    }
  }
}