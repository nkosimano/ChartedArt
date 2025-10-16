import { NextApiRequest, NextApiResponse } from 'next';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { supabase } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, email, authenticatorSelection } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: 'User ID and email are required' });
    }

    // Get existing credentials to exclude
    const { data: existingCredentials } = await supabase
      .from('user_biometric_credentials')
      .select('credential_id')
      .eq('user_id', user_id);

    const excludeCredentials = existingCredentials?.map(cred => ({
      id: cred.credential_id,
      type: 'public-key' as const,
    })) || [];

    const options = await generateRegistrationOptions({
      rpName: 'ChartedArt',
      rpID: process.env.NODE_ENV === 'production' ? 'chartedart.com' : 'localhost',
      userID: user_id,
      userName: email,
      userDisplayName: email,
      attestationType: 'direct',
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: authenticatorSelection?.authenticatorAttachment || 'platform',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
    });

    // Store challenge in session/cache for verification
    // In production, use Redis or similar
    const challengeKey = `webauthn_challenge_${user_id}_${Date.now()}`;
    
    // For now, we'll store in a simple in-memory cache
    // In production, implement proper challenge storage
    global.webauthnChallenges = global.webauthnChallenges || new Map();
    global.webauthnChallenges.set(challengeKey, {
      challenge: options.challenge,
      userId: user_id,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    res.json({
      challenge: options.challenge,
      excludeCredentials,
      rpId: options.rp.id,
      timeout: 60000,
    });

  } catch (error) {
    console.error('[WebAuthn] Registration begin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}