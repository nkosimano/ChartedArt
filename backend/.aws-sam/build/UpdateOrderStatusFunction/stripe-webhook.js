const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { errorResponse, successResponse } = require('../utils/auth');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Handle Stripe webhook events
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} Response
 */
exports.handler = async (event) => {
  console.log('Stripe Webhook - Headers:', JSON.stringify(event.headers, null, 2));

  try {
    // Get the signature from headers
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    
    if (!sig) {
      console.error('No Stripe signature found in headers');
      return errorResponse(400, 'Missing Stripe signature');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return errorResponse(500, 'Webhook not configured');
    }

    // Verify webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return errorResponse(400, `Webhook signature verification failed: ${err.message}`);
    }

    console.log(`Received Stripe event: ${stripeEvent.type}`);

    // Handle the event
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(stripeEvent.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(stripeEvent.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(stripeEvent.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return successResponse({
      received: true,
      event_type: stripeEvent.type
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return errorResponse(500, 'Webhook processing failed', error.message);
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  try {
    // Find order by payment intent ID
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('payment_intent_id', paymentIntent.id)
      .single();

    if (findError || !order) {
      console.error(`Order not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update order status to confirmed/paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error(`Failed to update order ${order.id}:`, updateError);
      return;
    }

    console.log(`Order ${order.id} confirmed and marked as paid`);

    // TODO: Send order confirmation email
    // await sendOrderConfirmationEmail(order);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  try {
    // Find order by payment intent ID
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('payment_intent_id', paymentIntent.id)
      .single();

    if (findError || !order) {
      console.error(`Order not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Only cancel if order is still pending
    if (order.status === 'pending') {
      // Get order items to restore stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      // Update order status to cancelled
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
          admin_notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
        })
        .eq('id', order.id);

      // Restore stock
      if (orderItems && orderItems.length > 0) {
        console.log(`Restoring stock for failed payment order ${order.id}`);
        for (const item of orderItems) {
          await supabase
            .from('products')
            .update({
              stock_quantity: supabase.raw(`stock_quantity + ${item.quantity}`)
            })
            .eq('id', item.product_id);
        }
      }

      console.log(`Order ${order.id} cancelled due to payment failure`);
    }

    // TODO: Send payment failure notification
    // await sendPaymentFailedEmail(order);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);

  try {
    // Find order by payment intent ID
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('payment_intent_id', paymentIntent.id)
      .single();

    if (findError || !order) {
      console.error(`Order not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Only cancel if order is still pending
    if (order.status === 'pending') {
      // Get order items to restore stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      // Update order status to cancelled
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'canceled',
          updated_at: new Date().toISOString(),
          admin_notes: 'Payment intent canceled by customer'
        })
        .eq('id', order.id);

      // Restore stock
      if (orderItems && orderItems.length > 0) {
        console.log(`Restoring stock for canceled payment order ${order.id}`);
        for (const item of orderItems) {
          await supabase
            .from('products')
            .update({
              stock_quantity: supabase.raw(`stock_quantity + ${item.quantity}`)
            })
            .eq('id', item.product_id);
        }
      }

      console.log(`Order ${order.id} cancelled due to payment cancellation`);
    }

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

/**
 * Handle charge refund
 */
async function handleChargeRefunded(charge) {
  console.log(`Charge refunded: ${charge.id}`);

  try {
    // Find order by payment intent ID
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('payment_intent_id', charge.payment_intent)
      .single();

    if (findError || !order) {
      console.error(`Order not found for charge: ${charge.id}`);
      return;
    }

    // Get order items to restore stock
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', order.id);

    // Update order status to refunded
    await supabase
      .from('orders')
      .update({
        status: 'refunded',
        payment_status: 'refunded',
        updated_at: new Date().toISOString(),
        admin_notes: `Refunded amount: ${charge.amount_refunded / 100}`
      })
      .eq('id', order.id);

    // Restore stock if full refund
    if (charge.amount_refunded === charge.amount && orderItems && orderItems.length > 0) {
      console.log(`Restoring stock for refunded order ${order.id}`);
      for (const item of orderItems) {
        await supabase
          .from('products')
          .update({
            stock_quantity: supabase.raw(`stock_quantity + ${item.quantity}`)
          })
          .eq('id', item.product_id);
      }
    }

    console.log(`Order ${order.id} marked as refunded`);

    // TODO: Send refund confirmation email
    // await sendRefundConfirmationEmail(order);

  } catch (error) {
    console.error('Error handling charge refund:', error);
  }
}
