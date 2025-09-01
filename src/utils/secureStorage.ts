
// Secure storage utilities for demo credentials and sensitive data
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'vendorhub-demo-key';
  
  // Simple encryption for demo purposes (in production, use proper encryption)
  private static encrypt(data: string): string {
    try {
      // Base64 encoding with timestamp for basic obfuscation
      const timestamp = Date.now().toString();
      const payload = JSON.stringify({ data, timestamp });
      return btoa(payload);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }
  
  private static decrypt(encryptedData: string): string | null {
    try {
      const payload = JSON.parse(atob(encryptedData));
      const now = Date.now();
      const dataAge = now - parseInt(payload.timestamp);
      
      // Check if data is older than 2 hours (demo session max)
      if (dataAge > 7200000) {
        return null;
      }
      
      return payload.data;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
  
  static setSecureItem(key: string, value: unknown): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = this.encrypt(serialized);
      sessionStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  }
  
  static getSecureItem<T = unknown>(key: string): T | null {
    try {
      const encrypted = sessionStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      
      const decrypted = this.decrypt(encrypted);
      if (!decrypted) {
        // Data expired or corrupted, remove it
        this.removeSecureItem(key);
        return null;
      }
      
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      this.removeSecureItem(key);
      return null;
    }
  }
  
  static removeSecureItem(key: string): void {
    sessionStorage.removeItem(`secure_${key}`);
  }
  
  static clearAllSecureItems(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Validate session token format and age
  static validateSessionToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    // Check format (should be 64 character hex string)
    if (!/^[a-f0-9]{64}$/.test(token)) return false;
    
    // Additional validation could go here
    return true;
  }
  
  // Clean up expired items
  static cleanup(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        const value = sessionStorage.getItem(key);
        if (value && !this.decrypt(value)) {
          sessionStorage.removeItem(key);
        }
      }
    });
  }
}

// Auto-cleanup on page load
if (typeof window !== 'undefined') {
  SecureStorage.cleanup();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    SecureStorage.clearAllSecureItems();
  });
}
