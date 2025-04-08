import { supabase } from './supabase/client';

/**
 * Updates the quantity of a product in the inventory
 * @param productId - The ID of the product to update
 * @param quantity - The new quantity to set (must be non-negative)
 * @returns A promise that resolves to the result of the update operation
 */
export async function updateProductQuantity(productId: string, quantity: number) {
  try {
    // Input validation
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    if (typeof quantity !== 'number' || isNaN(quantity)) {
      throw new Error('Quantity must be a valid number');
    }

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // Call the database function to update quantity
    const { data, error } = await supabase
      .rpc('update_product_quantity', {
        product_id: productId,
        new_quantity: quantity
      });

    if (error) throw error;

    // Check the response from the function
    if (!data.success) {
      throw new Error(data.error || 'Failed to update product quantity');
    }

    return {
      success: true,
      message: data.message
    };

  } catch (err) {
    console.error('Error updating product quantity:', err);
    throw err instanceof Error 
      ? err 
      : new Error('An unexpected error occurred while updating product quantity');
  }
}