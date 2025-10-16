import { NextApiRequest, NextApiResponse } from 'next';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
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
      device_name
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
    if (!challengeData) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: {
        id,
        rawId,
        response: {
          clientDataJSON: response.clientDataJSON,
          attestationObject: response.attestationObject,
        },
        type,
      },
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: process.env.NODE_ENV === 'production' ? 'chartedart.com' : 'localhost',
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ 
        error: 'Registration verification failed',
        verified: false 
      });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    // Clean up challenge
    removeChallenge(challenge);

    res.json({
      verified: true,
      publicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      credentialId: Buffer.from(credentialID).toString('base64'),
    });

  } catch (error) {
    console.error('[WebAuthn] Registration finish error:', error);
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