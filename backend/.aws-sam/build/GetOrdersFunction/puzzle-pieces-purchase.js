/**
 * Complete Puzzle Piece Purchase Handler
 * POST /puzzle-pieces/:id/purchase
 * Called after successful Stripe payment to finalize ownership
 */

const Stripe = require('stripe');
const { callDatabaseFunction, getSupabaseClient } = require('../utils/supabase');
const { 
  success,
  notFound,
  badRequest,
  unauthorized,
  internalError, 
  handleOptions,
  parseBody,
  validateRequiredFields,
  getUserIdFromEvent
} = require('../utils/response');

exports.handler = async (event) => {
  console.log('Purchase puzzle piece request:', JSON.stringify(event, null, 2));
  
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
    
    // Parse and validate request body
    const body = parseBody(event);
    const validation = validateRequiredFields(body, ['reservation_token', 'payment_intent_id']);
    if (!validation.valid) {
      return badRequest(validation.message);
    }
    
    const { reservation_token, payment_intent_id, order_id } = body;
    
    // Verify Stripe payment was successful
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      return badRequest('Payment has not been completed');
    }
    
    // Verify payment amount matches piece price
    const supabase = getSupabaseClient();
    const { data: piece } = await supabase
      .from('puzzle_pieces')
      .select('price, currency, reserved_by')
      .eq('id', pieceId)
      .single();
    
    if (!piece) {
      return notFound('Puzzle piece');
    }
    
    const expectedAmount = Math.round(piece.price * 100); // Convert to cents
    if (paymentIntent.amount !== expectedAmount) {
      console.error('Payment amount mismatch:', {
        expected: expectedAmount,
        received: paymentIntent.amount
      });
      return badRequest('Payment amount does not match piece price');
    }
    
    // Call database function to complete purchase atomically
    const result = await callDatabaseFunction('complete_puzzle_piece_purchase', {
      p_piece_id: pieceId,
      p_user_id: userId,
      p_reservation_token: reservation_token,
      p_stripe_payment_intent_id: payment_intent_id,
      p_order_id: order_id || null
    });
    
    if (!result.success) {
      const errorCode = result.error;
      
      switch (errorCode) {
        case 'PIECE_NOT_FOUND':
          return notFound('Puzzle piece');
          
        case 'INVALID_RESERVATION':
          return badRequest('No active reservation found or reservation expired');
          
        case 'INVALID_TOKEN':
          return badRequest('Invalid reservation token');
          
        default:
          return badRequest(result.message || 'Failed to complete purchase');
      }
    }
    
    // Get the completed piece with full details
    const { data: completedPiece } = await supabase
      .from('puzzle_pieces')
      .select(`
        *,
        profiles:owned_by (
          full_name,
          avatar_url
        )
      `)
      .eq('id', pieceId)
      .single();
    
    return success({
      purchased: true,
      piece: completedPiece,
      message: 'Congratulations! You now own this puzzle piece.',
      payment_intent_id: payment_intent_id
    });
    
  } catch (error) {
    console.error('Error completing purchase:', error);
    
    // Handle Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return badRequest(`Stripe error: ${error.message}`);
    }
    
    return internalError('Failed to complete purchase', error);
  }
};
