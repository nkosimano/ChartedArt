import { supabase } from '../supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

/**
 * Sleep helper for retry logic
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Base fetch function with authentication and error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  try {
    // Get current session and JWT token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Build full URL
    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`API Request: ${options.method || 'GET'} ${url}`);

    // Make request with auth token
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Request failed with status ${response.status}`;
      
      console.error(`API Error: ${response.status} - ${errorMessage}`, errorData);

      // Retry logic for retryable errors
      if (
        RETRY_CONFIG.retryableStatuses.includes(response.status) &&
        retryCount < RETRY_CONFIG.maxRetries
      ) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        return fetchAPI<T>(endpoint, options, retryCount + 1);
      }

      throw new APIError(response.status, errorMessage, errorData.error?.details);
    }

    // Parse and return response
    const data = await response.json();
    console.log(`API Response: ${options.method || 'GET'} ${url} - Success`);
    return data;

  } catch (error) {
    // Handle network errors
    if (error instanceof APIError) {
      throw error;
    }

    console.error('Network error:', error);

    // Retry on network errors
    if (retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
      console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
      await sleep(delay);
      return fetchAPI<T>(endpoint, options, retryCount + 1);
    }

    throw new APIError(0, 'Network error. Please check your connection.', error);
  }
}

/**
 * API client with all endpoints
 */
export const api = {
  /**
   * Order endpoints
   */
  orders: {
    /**
     * Create a new order
     */
    create: async (orderData: {
      items: Array<{
        product_id: string;
        quantity: number;
        customization?: any;
      }>;
      shipping_address: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      payment_method: 'card' | 'cash';
      payment_intent_id?: string;
    }) => {
      return fetchAPI<{ order: any; message: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    },

    /**
     * Get all orders (admin only)
     */
    list: async (params?: {
      status?: string;
      limit?: number;
      offset?: number;
      sort?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.sort) queryParams.append('sort', params.sort);

      const query = queryParams.toString();
      return fetchAPI<{ orders: any[]; count: number }>(`/admin/orders${query ? `?${query}` : ''}`);
    },

    /**
     * Update order status (admin only)
     */
    update: async (orderId: string, data: { status: string; notes?: string }) => {
      return fetchAPI<{ order: any; message: string }>(`/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  /**
   * Payment endpoints
   */
  payments: {
    /**
     * Create a Stripe payment intent
     */
    createIntent: async (amount: number, metadata?: Record<string, any>) => {
      return fetchAPI<{
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
        currency: string;
      }>('/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ amount, metadata }),
      });
    },
  },

  /**
   * File upload endpoints
   */
  uploads: {
    /**
     * Generate a presigned URL for file upload
     */
    generateUrl: async (filename: string, contentType: string, fileSize?: number) => {
      return fetchAPI<{
        uploadUrl: string;
        fileKey: string;
        expiresIn: number;
        message: string;
      }>('/generate-upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename, contentType, fileSize }),
      });
    },

    /**
     * Upload file directly to S3 using presigned URL
     */
    uploadFile: async (file: File, uploadUrl: string) => {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new APIError(response.status, 'File upload failed');
      }

      return { success: true };
    },
  },
};

export default api;
