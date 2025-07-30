import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Base API configuration
// Determine API base URL from environment variables, with sensible fallbacks
// const BASE_URL: string = 'https://booksiam.com';
const BASE_URL: string = 'https://booksiam.com';

// No prefix needed for backend endpoints
const API_PREFIX = '';

// Type for API response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API client class
class ApiClient {
  private client: AxiosInstance;

  private token: string | null = null;

  private userId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authorization token if it exists
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Add UserId header if it exists
        if (this.userId && config.headers) {
          config.headers.UserId = this.userId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          '[API Response]',
          response.status,
          response.config.url,
          response.data,
        );
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      },
    );

    // Load authentication data immediately so that each request has proper headers
    this.loadAuth();
  }

  // Set authentication token
  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Set user ID
  public setUserId(userId: string): void {
    this.userId = userId;
    localStorage.setItem('user_id', userId);
  }

  // Clear authentication data
  public clearAuth(): void {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  // Load authentication data from local storage
  public loadAuth(): void {
    this.token = localStorage.getItem('auth_token');
    this.userId = localStorage.getItem('user_id');
  }

  // Generic request method
  private async request<T>(
    config: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.request<T>(config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Unknown error occurred',
      };
    }
  }

  // GET request
  public async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url: url.startsWith('http') ? url : API_PREFIX ? `${API_PREFIX}/${url}` : url,
      params,
    });
  }

  // POST request
  public async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url: url.startsWith('http') ? url : API_PREFIX ? `${API_PREFIX}/${url}` : url,
      data,
    });
  }

  // PUT request
  public async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url: url.startsWith('http') ? url : API_PREFIX ? `${API_PREFIX}/${url}` : url,
      data,
    });
  }

  // DELETE request
  public async delete<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url: url.startsWith('http') ? url : API_PREFIX ? `${API_PREFIX}/${url}` : url,
      data,
    });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();
export default apiClient;
