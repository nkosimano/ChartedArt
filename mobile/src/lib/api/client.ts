import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-gateway-url.amazonaws.com/prod';

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
      return await SecureStore.getItemAsync('auth_token');
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
        await SecureStore.deleteItemAsync('auth_token');
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

  async uploadImage(uri: string, presignedUrl: string): Promise<void> {
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
