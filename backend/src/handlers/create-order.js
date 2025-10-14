const { createClient } = require('@supabase/supabase-js');
const { verifyUser, errorResponse, successResponse } = require('../utils/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Create a new order
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} Response with created order
 */
exports.handler = async (event) => {
  console.log('Create Order - Event:', JSON.stringify(event, null, 2));

  try {
    // Verify user authentication
    const user = await verifyUser(event);
    const userId = user.id;

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { items, shipping_address, payment_method, payment_intent_id } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(400, 'Order must contain at least one item');
    }

    if (!shipping_address) {
      return errorResponse(400, 'Shipping address is required');
    }

    if (!payment_method || !['card', 'cash'].includes(payment_method)) {
      return errorResponse(400, 'Valid payment method is required (card or cash)');
    }

    console.log(`Creating order for user ${userId} with ${items.length} items`);

    // Validate and fetch product details
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return errorResponse(500, 'Failed to validate products', productsError.message);
    }

    // Create a map of products for easy lookup
    const productsMap = {};
    products.forEach(product => {
      productsMap[product.id] = product;
    });

    // Validate all items and calculate total
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = productsMap[item.product_id];
      
      if (!product) {
        return errorResponse(400, `Product not found: ${item.product_id}`);
      }

      if (!product.available) {
        return errorResponse(400, `Product not available: ${product.name}`);
      }

      const quantity = parseInt(item.quantity) || 1;
      if (quantity < 1 || quantity > 100) {
        return errorResponse(400, 'Invalid quantity');
      }

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        quantity,
        price: product.price,
        customization: item.customization || null
      });
    }

    // Calculate shipping and tax
    const shipping = calculateShipping(shipping_address, subtotal);
    const tax = calculateTax(shipping_address, subtotal);
    const total = subtotal + shipping + tax;

    console.log(`Order totals - Subtotal: $${subtotal}, Shipping: $${shipping}, Tax: $${tax}, Total: $${total}`);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: payment_method === 'card' ? 'pending' : 'confirmed',
        subtotal,
        shipping,
        tax,
        total,
        shipping_address,
        payment_method,
        payment_intent_id: payment_intent_id || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return errorResponse(500, 'Failed to create order', orderError.message);
    }

    console.log(`Order created successfully: ${order.id}`);

    // Create order items
    const orderItems = validatedItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      return errorResponse(500, 'Failed to create order items', itemsError.message);
    }

    // Clear user's cart
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (cartError) {
      console.warn('Failed to clear cart:', cartError);
      // Don't fail the order creation if cart clearing fails
    }

    // TODO: Send order confirmation email
    // await sendOrderConfirmationEmail(order, user);

    console.log(`Order ${order.id} completed successfully`);

    return successResponse({
      order: {
        ...order,
        items: orderItems
      },
      message: 'Order created successfully'
    }, 201);

  } catch (error) {
    console.error('Error in create order handler:', error);
    
    if (error.message.includes('Unauthorized')) {
      return errorResponse(401, error.message);
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};

/**
 * Calculate shipping cost based on address and subtotal
 */
function calculateShipping(address, subtotal) {
  // Free shipping over $100
  if (subtotal >= 100) {
    return 0;
  }
  
  // Flat rate shipping
  return 9.99;
}

/**
 * Calculate tax based on address and subtotal
 */
function calculateTax(address, subtotal) {
  // Simple tax calculation (8% for example)
  // In production, use a tax calculation service like TaxJar or Avalara
  const taxRate = 0.08;
  return Math.round(subtotal * taxRate * 100) / 100;
}
