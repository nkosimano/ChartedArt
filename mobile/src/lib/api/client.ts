import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { 
  mockUser, 
  mockCartItems, 
  mockOrders, 
  mockOrderDetail, 
  mockGalleryItems 
} from './mockData';
import { APP_CONFIG, shouldUseMockData, shouldEnableLogging } from '../../config/app';

const API_BASE_URL = APP_CONFIG.API_BASE_URL;
const USE_MOCK_DATA = shouldUseMockData();

// Detect if running on web
const isWeb = Platform.OS === 'web';

interface RequestConfig {
  headers?: Record<string, string>;
  body?: any;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      if (isWeb) {
        return window.localStorage.getItem('auth_token');
      } else {
        return await SecureStore.getItemAsync('auth_token');
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  private async checkNetworkStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  private async request<T>(
    endpoint: string,
    method: string,
    config?: RequestConfig
  ): Promise<T> {
    // Use mock data if backend is not available
    if (USE_MOCK_DATA) {
      return this.getMockResponse<T>(endpoint, method, config?.body);
    }

    // Check network connectivity
    const isConnected = await this.checkNetworkStatus();
    if (!isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    // Get auth token
    const token = await this.getAuthToken();
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    // Inject auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build request options
    const options: RequestInit = {
      method,
      headers,
    };

    if (config?.body) {
      options.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, options);

      // Handle authentication errors
      if (response.status === 401) {
        // Clear stored token
        if (isWeb) {
          window.localStorage.removeItem('auth_token');
        } else {
          await SecureStore.deleteItemAsync('auth_token');
        }
        throw new Error('Session expired. Please log in again.');
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      // Parse and return response
      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'GET', config);
  }

  async post<T>(endpoint: string, data: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'POST', {
      ...config,
      body: data,
    });
  }

  async put<T>(endpoint: string, data: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'PUT', {
      ...config,
      body: data,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', config);
  }

  private async getMockResponse<T>(endpoint: string, method: string, body?: any): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (shouldEnableLogging()) {
      console.log(`[MOCK API] ${method} ${endpoint}`, body);
    }

    // Mock responses based on endpoint
    switch (endpoint) {
      case '/profile':
        return mockUser as T;

      case '/cart':
        if (method === 'GET') {
          return { items: mockCartItems } as T;
        }
        if (method === 'POST') {
          return { success: true, message: 'Item added to cart' } as T;
        }
        break;

      case '/orders':
        if (method === 'GET') {
          return { orders: mockOrders } as T;
        }
        if (method === 'POST') {
          return { id: 'new-order-123', success: true } as T;
        }
        break;

      case '/gallery':
        return { items: mockGalleryItems } as T;

      case '/events':
        if (method === 'GET') {
          return {
            events: [
              {
                id: '1',
                title: 'Summer Art Competition 2025',
                description: 'Show off your best summer-themed artwork!',
                event_type: 'competition',
                event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                registration_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
                entry_fee: 25.00,
                prize_pool: 5000.00,
                status: 'published',
                cover_image: 'https://picsum.photos/800/400?random=1',
              },
              {
                id: '2',
                title: 'Watercolor Workshop',
                description: 'Learn advanced watercolor techniques',
                event_type: 'workshop',
                event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                registration_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                entry_fee: 50.00,
                status: 'published',
                cover_image: 'https://picsum.photos/800/400?random=2',
              }
            ],
            count: 2
          } as T;
        }
        break;

      case '/generate-upload-url':
        return {
          uploadUrl: 'https://mock-s3-url.com/upload',
          imageKey: 'mock-image-key',
          imageUrl: `https://picsum.photos/400/300?random=${Date.now()}`
        } as T;

      case '/create-payment-intent':
        return {
          clientSecret: 'pi_mock_client_secret',
          ephemeralKey: 'ek_mock_ephemeral_key',
          customer: 'cus_mock_customer'
        } as T;

      default:
        if (endpoint.startsWith('/orders/')) {
          return mockOrderDetail as T;
        }
        if (endpoint.startsWith('/cart/')) {
          return { success: true } as T;
        }
        if (endpoint.startsWith('/events/')) {
          if (endpoint.includes('/register')) {
            return { registration: { id: 'reg-123', status: 'confirmed' }, message: 'Registration successful' } as T;
          }
          if (endpoint.includes('/submissions')) {
            if (endpoint.includes('/upload-request')) {
              return {
                uploadUrl: 'https://mock-s3-url.com/upload',
                submissionId: 'sub-123',
                expiresIn: 3600
              } as T;
            }
            if (endpoint.includes('/confirm')) {
              return { submission: { id: 'sub-123', status: 'pending' }, message: 'Submission confirmed' } as T;
            }
            return { submissions: [], count: 0 } as T;
          }
          return {
            event: {
              id: '1',
              title: 'Summer Art Competition 2025',
              description: 'Show off your best summer-themed artwork!',
              event_type: 'competition',
              event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              registration_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
              entry_fee: 25.00,
              prize_pool: 5000.00,
              status: 'published',
              cover_image: 'https://picsum.photos/800/400?random=1',
            }
          } as T;
        }
        return { success: true, message: 'Mock response' } as T;
    }

    return { success: true } as T;
  }

  async uploadImage(uri: string, presignedUrl: string): Promise<void> {
    if (USE_MOCK_DATA) {
      // Mock upload - just wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[MOCK API] Image upload simulated');
      return;
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL);
export default apiClient;
