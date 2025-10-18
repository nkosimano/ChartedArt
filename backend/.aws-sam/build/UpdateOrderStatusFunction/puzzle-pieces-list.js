/**
 * List Puzzle Pieces Handler
 * GET /movements/:movementId/puzzle-pieces
 * Returns all puzzle pieces for a movement with availability status
 */

const { getSupabaseClient } = require('../utils/supabase');
const { success, notFound, internalError, handleOptions, getUserIdFromEvent } = require('../utils/response');

exports.handler = async (event) => {
  console.log('List puzzle pieces request:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    const movementId = event.pathParameters?.movementId;
    
    if (!movementId) {
      return notFound('Movement');
    }
    
    const supabase = getSupabaseClient();
    const userId = getUserIdFromEvent(event);
    
    // Query parameters
    const params = event.queryStringParameters || {};
    const status = params.status; // available, reserved, sold
    const rarity = params.rarity;
    
    // Get all puzzle pieces for the movement
    let query = supabase
      .from('puzzle_pieces')
      .select(`
        id,
        movement_id,
        piece_number,
        total_pieces,
        title,
        description,
        artwork_url,
        artwork_thumbnail,
        artist_id,
        artist_name,
        price,
        currency,
        rarity,
        edition_type,
        status,
        reserved_by,
        reservation_expires_at,
        owned_by,
        purchased_at,
        tags,
        is_unlocked,
        created_at,
        profiles:owned_by (
          full_name,
          avatar_url
        )
      `)
      .eq('movement_id', movementId);
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (rarity) {
      query = query.eq('rarity', rarity);
    }
    
    // Order by piece number
    query = query.order('piece_number', { ascending: true });
    
    const { data: pieces, error } = await query;
    
    if (error) {
      console.error('Error fetching puzzle pieces:', error);
      throw error;
    }
    
    // Enrich pieces with additional info
    const enrichedPieces = pieces.map(piece => {
      const isReservedByUser = userId && piece.reserved_by === userId;
      const isOwnedByUser = userId && piece.owned_by === userId;
      
      // Calculate time remaining for reservation
      let reservationTimeRemaining = null;
      if (piece.status === 'reserved' && piece.reservation_expires_at) {
        const expiresAt = new Date(piece.reservation_expires_at);
        const now = new Date();
        reservationTimeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000)); // seconds
      }
      
      return {
        id: piece.id,
        movement_id: piece.movement_id,
        piece_number: piece.piece_number,
        total_pieces: piece.total_pieces,
        title: piece.title,
        description: piece.description,
        artwork_url: piece.artwork_url,
        artwork_thumbnail: piece.artwork_thumbnail,
        artist_id: piece.artist_id,
        artist_name: piece.artist_name,
        price: piece.price,
        currency: piece.currency,
        rarity: piece.rarity,
        edition_type: piece.edition_type,
        status: piece.status,
        tags: piece.tags,
        is_unlocked: piece.is_unlocked,
        created_at: piece.created_at,
        
        // Reservation info (only if reserved by current user)
        is_reserved_by_user: isReservedByUser,
        reservation_expires_at: isReservedByUser ? piece.reservation_expires_at : null,
        reservation_time_remaining: isReservedByUser ? reservationTimeRemaining : null,
        
        // Ownership info
        is_owned_by_user: isOwnedByUser,
        purchased_at: piece.purchased_at,
        owner: piece.status === 'sold' && piece.profiles ? {
          name: piece.profiles.full_name,
          avatar: piece.profiles.avatar_url
        } : null
      };
    });
    
    // Calculate collection stats
    const stats = {
      total: enrichedPieces.length,
      available: enrichedPieces.filter(p => p.status === 'available').length,
      reserved: enrichedPieces.filter(p => p.status === 'reserved').length,
      sold: enrichedPieces.filter(p => p.status === 'sold').length,
      owned_by_user: userId ? enrichedPieces.filter(p => p.is_owned_by_user).length : 0,
      completion_percentage: userId && enrichedPieces.length > 0
        ? Math.round((enrichedPieces.filter(p => p.is_owned_by_user).length / enrichedPieces.length) * 100)
        : 0
    };
    
    return success({
      pieces: enrichedPieces,
      stats
    });
    
  } catch (error) {
    console.error('Error listing puzzle pieces:', error);
    return internalError('Failed to fetch puzzle pieces', error);
  }
};
