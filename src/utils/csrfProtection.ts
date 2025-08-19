import React from 'react';
import { secureSessionManager } from './secureSessionManager';

class CSRFProtection {
  private static instance: CSRFProtection;
  private tokenKey = 'csrf_token';

  private constructor() {}

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async getToken(): Promise<string> {
    let token = await secureSessionManager.getSecureItem(this.tokenKey);
    
    if (!token) {
      token = this.generateToken();
      await secureSessionManager.setSecureItem(this.tokenKey, token, 3600000); // 1 hour
    }
    
    return token;
  }

  async validateToken(providedToken: string): Promise<boolean> {
    if (!providedToken || typeof providedToken !== 'string') {
      return false;
    }

    const storedToken = await secureSessionManager.getSecureItem(this.tokenKey);
    if (!storedToken) {
      return false;
    }

    return providedToken === storedToken;
  }

  async refreshToken(): Promise<string> {
    const newToken = this.generateToken();
    await secureSessionManager.setSecureItem(this.tokenKey, newToken, 3600000);
    return newToken;
  }

  async clearToken(): Promise<void> {
    await secureSessionManager.removeSecureItem(this.tokenKey);
  }

  createTokenInput(token: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = '_csrf_token';
    input.value = token;
    return input;
  }

  async enhanceForm(form: HTMLFormElement): Promise<void> {
    const existingToken = form.querySelector('input[name="_csrf_token"]');
    if (existingToken) {
      existingToken.remove();
    }

    const token = await this.getToken();
    const tokenInput = this.createTokenInput(token);
    form.appendChild(tokenInput);
  }

  async enhanceFetch(url: string, options: RequestInit = {}): Promise<RequestInit> {
    const token = await this.getToken();
    
    return {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': token,
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
  }
}

export const csrfProtection = CSRFProtection.getInstance();

export const withCSRF = async (fetchFn: (url: string, options?: RequestInit) => Promise<Response>) => {
  return async (url: string, options: RequestInit = {}) => {
    const enhancedOptions = await csrfProtection.enhanceFetch(url, options);
    return fetchFn(url, enhancedOptions);
  };
};

export const useCSRF = () => {
  const [token, setToken] = React.useState<string>('');

  React.useEffect(() => {
    csrfProtection.getToken().then(setToken);
  }, []);

  const refreshToken = async () => {
    const newToken = await csrfProtection.refreshToken();
    setToken(newToken);
    return newToken;
  };

  const validateToken = (providedToken: string) => {
    return csrfProtection.validateToken(providedToken);
  };

  return {
    token,
    refreshToken,
    validateToken
  };
};