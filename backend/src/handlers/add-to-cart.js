const { createClient } = require('@supabase/supabase-js');
const { verifyUser, errorResponse, successResponse } = require('../utils/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Price calculation logic - SERVER SIDE ONLY
 * This prevents price manipulation from the client
 */
const PRICING = {
  sizes: {
    '8x10': 29.99,
    '11x14': 39.99,
    '16x20': 59.99,
    '24x36': 89.99,
  },
  frames: {
    'none': 0,
    'black': 15,
    'white': 15,
    'wood': 20,
  }
};

/**
 * Calculate price based on size and frame
 */
function calculatePrice(size, frame) {
  const sizePrice = PRICING.sizes[size];
  const framePrice = PRICING.frames[frame];
  
  if (sizePrice === undefined) {
    throw new Error(`Invalid size: ${size}`);
  }
  
  if (framePrice === undefined) {
    throw new Error(`Invalid frame: ${frame}`);
  }
  
  return sizePrice + framePrice;
}

/**
 * Validate image URL is from authorized source
 */
function validateImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }
  
  // Check if URL is from your S3 bucket or allowed CDN
  const allowedDomains = [
    process.env.S3_BUCKET_URL,
    'https://chartedart-uploads',
    'https://d3example.cloudfront.net', // Add your CloudFront domain
  ].filter(Boolean);
  
  return allowedDomains.some(domain => imageUrl.startsWith(domain));
}

/**
 * Add item to cart
 */
exports.handler = async (event) => {
  console.log('Add to Cart - Event:', JSON.stringify(event, null, 2));

  try {
    // Verify user authentication
    const user = await verifyUser(event);
    const userId = user.id;

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { imageUrl, name, size, frame, quantity = 1 } = body;

    // Validate required fields
    if (!imageUrl) {
      return errorResponse(400, 'Image URL is required');
    }

    if (!size) {
      return errorResponse(400, 'Size selection is required');
    }

    if (!frame) {
      return errorResponse(400, 'Frame selection is required');
    }

    // Validate image URL
    if (!validateImageUrl(imageUrl)) {
      console.warn(`Invalid image URL attempted: ${imageUrl}`);
      return errorResponse(400, 'Invalid image URL. Please upload your image again.');
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 10) {
      return errorResponse(400, 'Quantity must be between 1 and 10');
    }

    // SERVER-SIDE PRICE CALCULATION (don't trust client)
    let unitPrice;
    try {
      unitPrice = calculatePrice(size, frame);
    } catch (error) {
      return errorResponse(400, error.message);
    }

    console.log(`Adding to cart - Size: ${size}, Frame: ${frame}, Price: $${unitPrice}, Quantity: ${qty}`);

    // Check if item already exists in cart (same image, size, frame)
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('image_url', imageUrl)
      .eq('size', size)
      .eq('frame', frame)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing cart item:', checkError);
      return errorResponse(500, 'Failed to check cart', checkError.message);
    }

    let cartItem;

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + qty;
      
      if (newQuantity > 10) {
        return errorResponse(400, 'Maximum quantity per item is 10');
      }

      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return errorResponse(500, 'Failed to update cart', updateError.message);
      }

      cartItem = updated;
      console.log(`Updated cart item ${cartItem.id} - New quantity: ${newQuantity}`);
    } else {
      // Add new item to cart
      const { data: inserted, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          image_url: imageUrl,
          name: name || `Custom Print - ${size}`,
          size,
          frame,
          price: unitPrice, // Use server-calculated price
          quantity: qty,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding to cart:', insertError);
        return errorResponse(500, 'Failed to add to cart', insertError.message);
      }

      cartItem = inserted;
      console.log(`Added new cart item ${cartItem.id}`);
    }

    // Get updated cart summary
    const { data: cartSummary, error: summaryError } = await supabase
      .from('cart_items')
      .select('quantity, price')
      .eq('user_id', userId);

    let itemCount = 0;
    let totalAmount = 0;

    if (!summaryError && cartSummary) {
      itemCount = cartSummary.reduce((sum, item) => sum + item.quantity, 0);
      totalAmount = cartSummary.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    return successResponse({
      message: 'Item added to cart successfully',
      item: cartItem,
      cart: {
        itemCount,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    }, 201);

  } catch (error) {
    console.error('Error in add to cart handler:', error);
    
    if (error.message.includes('Unauthorized')) {
      return errorResponse(401, error.message);
    }
    
    return errorResponse(500, 'Internal server error', error.message);
  }
};
