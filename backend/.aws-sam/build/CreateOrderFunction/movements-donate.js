/**
 * Initiate Movement Donation Handler
 * POST /movements/:id/donate
 * Creates Stripe Payment Intent and pending donation record
 */

const Stripe = require('stripe');
const { getSupabaseClient, insertRecord, getRecordById } = require('../utils/supabase');
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
  console.log('Donate to movement request:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    // Get user ID from authorizer
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return unauthorized('Authentication required to donate');
    }
    
    const movementId = event.pathParameters?.id;
    if (!movementId) {
      return badRequest('Movement ID is required');
    }
    
    // Parse and validate request body
    const body = parseBody(event);
    const validation = validateRequiredFields(body, ['amount']);
    if (!validation.valid) {
      return badRequest(validation.message);
    }
    
    const { 
      amount, 
      currency = 'ZAR',
      donor_anonymous = false,
      message,
      in_memory_of
    } = body;
    
    // Validate amount
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount < 10) {
      return badRequest('Donation amount must be at least R10');
    }
    
    if (donationAmount > 1000000) {
      return badRequest('Donation amount cannot exceed R1,000,000');
    }
    
    const supabase = getSupabaseClient();
    
    // Verify movement exists and is active
    const movement = await getRecordById('movements', movementId, 'id, name, status, visibility');
    
    if (!movement) {
      return notFound('Movement');
    }
    
    if (movement.status !== 'active') {
      return badRequest('This movement is not currently accepting donations');
    }
    
    // Get participant record (optional - can donate without joining)
    const { data: participant } = await supabase
      .from('movement_participants')
      .select('id')
      .eq('movement_id', movementId)
      .eq('user_id', userId)
      .single();
    
    // Get user profile for donor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(donationAmount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        movement_id: movementId,
        movement_name: movement.name,
        user_id: userId,
        participant_id: participant?.id || null,
        type: 'movement_donation'
      },
      description: `Donation to ${movement.name}`,
      receipt_email: profile?.email
    });
    
    // Create pending donation record
    const donation = await insertRecord('movement_donations', {
      movement_id: movementId,
      user_id: userId,
      participant_id: participant?.id || null,
      amount: donationAmount,
      currency: currency,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending', // Will be updated to 'completed' by webhook
      donor_name: profile?.full_name,
      donor_anonymous: donor_anonymous,
      message: message || null,
      in_memory_of: in_memory_of || null
    });
    
    return success({
      donation_id: donation.id,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: donationAmount,
      currency: currency,
      movement: {
        id: movement.id,
        name: movement.name
      }
    });
    
  } catch (error) {
    console.error('Error creating donation:', error);
    
    // Handle Stripe errors
    if (error.type === 'StripeCardError') {
      return badRequest(`Card error: ${error.message}`);
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return badRequest(`Invalid request: ${error.message}`);
    }
    
    return internalError('Failed to process donation', error);
  }
};
