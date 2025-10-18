/**
 * Stripe Webhook Handler for Movement Donations
 * POST /webhooks/stripe/movements
 * CRITICAL: This is the ONLY way donation status can be set to 'completed'
 */

const Stripe = require('stripe');
const { getSupabaseClient, updateRecord } = require('../utils/supabase');
const { success, badRequest, internalError } = require('../utils/response');

exports.handler = async (event) => {
  console.log('Stripe webhook received');
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Verify webhook signature
    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    
    if (!signature) {
      console.error('Missing Stripe signature');
      return badRequest('Missing signature');
    }
    
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return badRequest(`Webhook signature verification failed: ${err.message}`);
    }
    
    console.log('Stripe event type:', stripeEvent.type);
    
    // Handle payment_intent.succeeded event
    if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object;
      
      // Check if this is a movement donation
      if (paymentIntent.metadata?.type !== 'movement_donation') {
        console.log('Not a movement donation, skipping');
        return success({ received: true, skipped: true });
      }
      
      const supabase = getSupabaseClient();
      
      // Find the pending donation
      const { data: donation, error: findError } = await supabase
        .from('movement_donations')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single();
      
      if (findError || !donation) {
        console.error('Donation not found for payment intent:', paymentIntent.id);
        return internalError('Donation record not found');
      }
      
      // CRITICAL: Update donation status to completed
      // This triggers the database trigger to update movement_metrics
      const { error: updateError } = await supabase
        .from('movement_donations')
        .update({
          status: 'completed',
          stripe_charge_id: paymentIntent.latest_charge,
          payment_method_type: paymentIntent.payment_method_types?.[0],
          completed_at: new Date().toISOString()
        })
        .eq('id', donation.id);
      
      if (updateError) {
        console.error('Failed to update donation:', updateError);
        return internalError('Failed to update donation status');
      }
      
      console.log(`✅ Donation ${donation.id} marked as completed`);
      
      // TODO: Send confirmation email
      // TODO: Send notification to movement organizers
      
      return success({
        received: true,
        donation_id: donation.id,
        amount: donation.amount,
        movement_id: donation.movement_id
      });
    }
    
    // Handle payment_intent.payment_failed event
    if (stripeEvent.type === 'payment_intent.payment_failed') {
      const paymentIntent = stripeEvent.data.object;
      
      if (paymentIntent.metadata?.type !== 'movement_donation') {
        return success({ received: true, skipped: true });
      }
      
      const supabase = getSupabaseClient();
      
      // Update donation to failed status
      await supabase
        .from('movement_donations')
        .update({
          status: 'failed'
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);
      
      console.log(`❌ Payment failed for intent ${paymentIntent.id}`);
      
      return success({ received: true });
    }
    
    // Handle refund events
    if (stripeEvent.type === 'charge.refunded') {
      const charge = stripeEvent.data.object;
      
      const supabase = getSupabaseClient();
      
      // Update donation to refunded status
      await supabase
        .from('movement_donations')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString()
        })
        .eq('stripe_charge_id', charge.id);
      
      console.log(`🔄 Refund processed for charge ${charge.id}`);
      
      return success({ received: true });
    }
    
    // Log unhandled event types
    console.log(`Unhandled event type: ${stripeEvent.type}`);
    return success({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return internalError('Webhook processing failed', error);
  }
};
