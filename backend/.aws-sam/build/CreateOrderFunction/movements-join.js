/**
 * Join Movement Handler
 * POST /movements/:id/join
 * Allows authenticated users to join a movement
 */

const { getSupabaseClient, insertRecord, getRecordById } = require('../utils/supabase');
const { 
  success, 
  created,
  notFound, 
  conflict,
  badRequest,
  unauthorized,
  internalError, 
  handleOptions,
  parseBody,
  getUserIdFromEvent
} = require('../utils/response');

exports.handler = async (event) => {
  console.log('Join movement request:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    // Get user ID from authorizer
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return unauthorized('Authentication required to join movement');
    }
    
    const movementId = event.pathParameters?.id;
    if (!movementId) {
      return badRequest('Movement ID is required');
    }
    
    // Parse request body (optional fields)
    let body = {};
    try {
      body = event.body ? parseBody(event) : {};
    } catch (e) {
      return badRequest('Invalid request body');
    }
    
    const { motivation, public_profile = true } = body;
    
    const supabase = getSupabaseClient();
    
    // Verify movement exists and is active
    const movement = await getRecordById('movements', movementId, 'id, name, status, visibility');
    
    if (!movement) {
      return notFound('Movement');
    }
    
    if (movement.status !== 'active') {
      return badRequest('This movement is not currently active');
    }
    
    if (movement.visibility !== 'public') {
      return badRequest('This movement is not available');
    }
    
    // Check if user already joined
    const { data: existing } = await supabase
      .from('movement_participants')
      .select('id')
      .eq('movement_id', movementId)
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      return conflict('You have already joined this movement');
    }
    
    // Generate unique referral code
    const referralCode = `${movement.name.substring(0, 3).toUpperCase()}-${userId.substring(0, 8).toUpperCase()}`;
    
    // Create participant record
    const participant = await insertRecord('movement_participants', {
      movement_id: movementId,
      user_id: userId,
      role: 'member',
      motivation: motivation || null,
      public_profile,
      referral_code: referralCode
    });
    
    // Get updated participant with user profile
    const { data: enrichedParticipant } = await supabase
      .from('movement_participants')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', participant.id)
      .single();
    
    return created({
      participant: enrichedParticipant,
      message: `Successfully joined ${movement.name}!`,
      referral_code: referralCode
    }, participant.id);
    
  } catch (error) {
    console.error('Error joining movement:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return conflict('You have already joined this movement');
    }
    
    return internalError('Failed to join movement', error);
  }
};
