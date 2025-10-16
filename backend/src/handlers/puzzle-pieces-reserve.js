/**
 * Reserve Puzzle Piece Handler
 * POST /puzzle-pieces/:id/reserve
 * CRITICAL: Uses atomic database function to prevent race conditions
 */

const { callDatabaseFunction } = require('../utils/supabase');
const { 
  success,
  notFound,
  conflict,
  badRequest,
  unauthorized,
  internalError, 
  handleOptions,
  getUserIdFromEvent
} = require('../utils/response');

exports.handler = async (event) => {
  console.log('Reserve puzzle piece request:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    // Get user ID from authorizer
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return unauthorized('Authentication required to reserve puzzle pieces');
    }
    
    const pieceId = event.pathParameters?.id;
    if (!pieceId) {
      return badRequest('Puzzle piece ID is required');
    }
    
    // Optional: custom reservation time (default 15 minutes)
    const reservationMinutes = 15;
    
    // Call atomic database function (uses SELECT FOR UPDATE)
    // This function handles all validation and prevents race conditions
    const result = await callDatabaseFunction('reserve_puzzle_piece', {
      p_piece_id: pieceId,
      p_user_id: userId,
      p_reservation_minutes: reservationMinutes
    });
    
    // Check if reservation was successful
    if (!result.success) {
      const errorCode = result.error;
      
      switch (errorCode) {
        case 'PIECE_NOT_FOUND':
          return notFound('Puzzle piece');
          
        case 'PIECE_NOT_AVAILABLE':
          return conflict('This puzzle piece is no longer available', {
            current_status: result.status
          });
          
        case 'EXISTING_RESERVATION':
          return conflict('You already have an active reservation', {
            existing_reservation_id: result.existing_reservation_id,
            message: 'Please complete or cancel your existing reservation first'
          });
          
        default:
          return badRequest(result.message || 'Failed to reserve puzzle piece');
      }
    }
    
    // Success! Return reservation details
    return success({
      reserved: true,
      reservation: result.reservation,
      message: 'Puzzle piece reserved successfully! Complete your purchase within 15 minutes.'
    });
    
  } catch (error) {
    console.error('Error reserving puzzle piece:', error);
    return internalError('Failed to reserve puzzle piece', error);
  }
};
