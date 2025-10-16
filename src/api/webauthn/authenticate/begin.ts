import { NextApiRequest, NextApiResponse } from 'next';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { supabase } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { purpose = 'login' } = req.body;

    // Get user credentials based on session or allow any registered credential
    let allowCredentials = [];

    // If we have a user session, get their specific credentials
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          const { data: userCredentials } = await supabase
            .from('user_biometric_credentials')
            .select('credential_id')
            .eq('user_id', user.id);

          allowCredentials = userCredentials?.map(cred => ({
            id: cred.credential_id,
            type: 'public-key' as const,
            transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
          })) || [];
        }
      } catch (error) {
        // Continue without specific credentials - allow any registered credential
        console.log('[WebAuthn] No valid session, allowing any registered credential');
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: process.env.NODE_ENV === 'production' ? 'chartedart.com' : 'localhost',
      allowCredentials,
      userVerification: purpose === 'payment' ? 'required' : 'preferred',
      timeout: 60000,
    });

    // Store challenge for verification
    const challengeKey = `webauthn_auth_${Date.now()}_${Math.random()}`;
    
    global.webauthnChallenges = global.webauthnChallenges || new Map();
    global.webauthnChallenges.set(challengeKey, {
      challenge: options.challenge,
      purpose,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    res.json({
      challenge: options.challenge,
      allowCredentials: options.allowCredentials,
      timeout: options.timeout,
      rpId: options.rpID,
      userVerification: options.userVerification,
    });

  } catch (error) {
    console.error('[WebAuthn] Authentication begin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}