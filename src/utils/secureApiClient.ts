import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from './secureLogger';
import { csrfProtection } from './csrfProtection';

interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  requireAuth?: boolean;
  requireCSRF?: boolean;
  timeout?: number;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

class SecureApiClient {
  private static instance: SecureApiClient;
  private baseUrl: string;
  private defaultTimeout = 10000; // 10 seconds

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  static getInstance(): SecureApiClient {
    if (!SecureApiClient.instance) {
      SecureApiClient.instance = new SecureApiClient();
    }
    return SecureApiClient.instance;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      return {
        'Authorization': `Bearer ${session.access_token}`,
        'X-User-ID': session.user.id
      };
    } catch (error) {
      secureLogger.error('Failed to get auth headers', { 
        action: 'get_auth_headers' 
      });
      throw error;
    }
  }

  private async validateSession(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      secureLogger.warn('Session validation failed', { 
        action: 'validate_session' 
      });
      return false;
    }
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, this.baseUrl);
      return urlObj.toString();
    } catch (error) {
      throw new Error('Invalid URL provided');
    }
  }

  private createAbortController(timeout: number): AbortController {
    const controller = new AbortController();
    
    setTimeout(() => {
      controller.abort();
    }, timeout);
    
    return controller;
  }

  async request<T = unknown>(
    endpoint: string, 
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true,
      requireCSRF = true,
      timeout = this.defaultTimeout
    } = config;

    try {
      // Validate session if authentication is required
      if (requireAuth) {
        const isValidSession = await this.validateSession();
        if (!isValidSession) {
          return {
            data: null,
            error: 'Authentication required',
            status: 401
          };
        }
      }

      // Sanitize URL
      const sanitizedUrl = this.sanitizeUrl(`${this.baseUrl}${endpoint}`);
      
      // Build headers
      let requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers
      };

      // Add auth headers if required
      if (requireAuth) {
        const authHeaders = await this.getAuthHeaders();
        requestHeaders = { ...requestHeaders, ...authHeaders };
      }

      // Add CSRF protection if required
      if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = await csrfProtection.getToken();
        requestHeaders['X-CSRF-Token'] = csrfToken;
      }

      // Create abort controller for timeout
      const controller = this.createAbortController(timeout);

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      // Log request (sanitized)
      secureLogger.info('API Request', {
        action: 'api_request'
      });

      // Make request
      const response = await fetch(sanitizedUrl, requestOptions);

      // Parse response
      let responseData: T | null = null;
      let errorMessage: string | null = null;

      try {
        const textResponse = await response.text();
        if (textResponse) {
          responseData = JSON.parse(textResponse) as T;
        }
      } catch (parseError) {
        secureLogger.warn('Failed to parse response as JSON', { 
          action: 'parse_response'
        });
      }

      // Handle errors
      if (!response.ok) {
        const message = (responseData && typeof responseData === 'object' && responseData !== null && 'message' in responseData)
          ? (responseData as { message?: unknown }).message
          : undefined;
        const err = (responseData && typeof responseData === 'object' && responseData !== null && 'error' in responseData)
          ? (responseData as { error?: unknown }).error
          : undefined;
        errorMessage = (typeof message === 'string' ? message : undefined) ||
                       (typeof err === 'string' ? err : undefined) ||
                       `Request failed with status ${response.status}`;
         
         secureLogger.error('API request failed', {
           action: 'api_request_failed'
         });
      }

      return {
        data: responseData,
        error: errorMessage,
        status: response.status
      };

    } catch (error) {
      let errorMessage = 'Request failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = 'Network error';
        } else {
          errorMessage = error.message;
        }
      }

      secureLogger.error('API client error', {
        action: 'api_client_error'
      });

      return {
        data: null,
        error: errorMessage,
        status: 0
      };
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  async put<T>(endpoint: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  async delete<T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }
}

export const secureApiClient = SecureApiClient.getInstance();

// Helper hook for React components
export const useSecureApi = () => {
  return {
    get: secureApiClient.get.bind(secureApiClient),
    post: secureApiClient.post.bind(secureApiClient),
    put: secureApiClient.put.bind(secureApiClient),
    delete: secureApiClient.delete.bind(secureApiClient),
    patch: secureApiClient.patch.bind(secureApiClient),
    request: secureApiClient.request.bind(secureApiClient)
  };
};