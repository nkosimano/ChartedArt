const Stripe = require('stripe');
const { verifyUser, errorResponse, successResponse } = require('../utils/auth');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Minimum amount: $0.50 (50 cents in smallest currency unit)
const MIN_AMOUNT = 50;

/**
 * Create a Stripe payment intent
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} Response with client secret
 */
exports.handler = async (event) => {
  console.log('Create Payment Intent - Event:', JSON.stringify(event, null, 2));

  try {
    // Verify user authentication
    const user = await verifyUser(event);

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { amount, currency = 'usd', metadata = {} } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number') {
      return errorResponse(400, 'Valid amount is required');
    }

    if (amount < MIN_AMOUNT) {
      return errorResponse(400, `Amount must be at least $${MIN_AMOUNT / 100}`);
    }

    if (amount > 999999) {
      return errorResponse(400, 'Amount exceeds maximum allowed');
    }

    console.log(`Creating payment intent for user ${user.id}: $${amount / 100} ${currency}`);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        user_id: user.id,
        user_email: user.email,
        ...metadata
      },
      description: `ChartedArt order for ${user.email}`
    });

    console.log(`Payment intent created: ${paymentIntent.id}`);

    // Return only the client secret (never expose the full payment intent)
    return successResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error.message.includes('Unauthorized')) {
      return errorResponse(401, error.message);
    }

    // Handle Stripe-specific errors
    if (error.type) {
      switch (error.type) {
        case 'StripeCardError':
          return errorResponse(400, 'Card error', error.message);
        case 'StripeInvalidRequestError':
          return errorResponse(400, 'Invalid request', error.message);
        case 'StripeAPIError':
          return errorResponse(500, 'Payment service error', 'Please try again later');
        case 'StripeConnectionError':
          return errorResponse(503, 'Payment service unavailable', 'Please try again later');
        case 'StripeAuthenticationError':
          return errorResponse(500, 'Payment configuration error');
        default:
          return errorResponse(500, 'Payment error', error.message);
      }
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};
