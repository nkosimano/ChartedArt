/**
 * Cancel Puzzle Piece Reservation Handler
 * DELETE /puzzle-pieces/:id/reservation
 * Allows users to manually cancel their active reservation
 */

const { callDatabaseFunction } = require('../utils/supabase');
const { 
  success,
  notFound,
  badRequest,
  unauthorized,
  internalError, 
  handleOptions,
  getUserIdFromEvent
} = require('../utils/response');

exports.handler = async (event) => {
  console.log('Cancel reservation request:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    // Get user ID from authorizer
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return unauthorized('Authentication required');
    }
    
    const pieceId = event.pathParameters?.id;
    if (!pieceId) {
      return badRequest('Puzzle piece ID is required');
    }
    
    // Call database function to cancel reservation
    const result = await callDatabaseFunction('cancel_puzzle_piece_reservation', {
      p_piece_id: pieceId,
      p_user_id: userId
    });
    
    if (!result.success) {
      const errorCode = result.error;
      
      switch (errorCode) {
        case 'PIECE_NOT_FOUND':
          return notFound('Puzzle piece');
          
        case 'INVALID_RESERVATION':
          return badRequest(result.message || 'No active reservation found');
          
        default:
          return badRequest('Failed to cancel reservation');
      }
    }
    
    return success({
      cancelled: true,
      message: 'Reservation cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return internalError('Failed to cancel reservation', error);
  }
};
