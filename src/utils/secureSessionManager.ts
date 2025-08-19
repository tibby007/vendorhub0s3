interface SessionData {
  data: any;
  timestamp: number;
  sessionId: string;
  integrity: string;
}

class SecureSessionManager {
  private static instance: SecureSessionManager;
  private sessionKey: CryptoKey | null = null;
  private sessionId: string = '';

  private constructor() {
    this.initializeSession();
  }

  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager();
    }
    return SecureSessionManager.instance;
  }

  private async initializeSession(): Promise<void> {
    this.sessionId = this.generateSessionId();
    this.sessionKey = await this.generateEncryptionKey();
  }

  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async generateEncryptionKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.sessionKey) {
      await this.initializeSession();
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.sessionKey!,
      dataBuffer
    );

    const combinedData = new Uint8Array(iv.length + encryptedData.byteLength);
    combinedData.set(iv);
    combinedData.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combinedData));
  }

  private async decrypt(encryptedData: string): Promise<string | null> {
    try {
      if (!this.sessionKey) {
        await this.initializeSession();
      }

      const combinedData = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combinedData.slice(0, 12);
      const encrypted = combinedData.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.sessionKey!,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.warn('Decryption failed, data may be corrupted');
      return null;
    }
  }

  private async calculateIntegrity(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + this.sessionId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }

  private async verifyIntegrity(data: string, integrity: string): Promise<boolean> {
    const expectedIntegrity = await this.calculateIntegrity(data);
    return expectedIntegrity === integrity;
  }

  async setSecureItem(key: string, value: any, ttl: number = 7200000): Promise<void> {
    try {
      const timestamp = Date.now();
      const serializedData = JSON.stringify(value);
      const integrity = await this.calculateIntegrity(serializedData);
      
      const sessionData: SessionData = {
        data: value,
        timestamp: timestamp + ttl,
        sessionId: this.sessionId,
        integrity
      };

      const encrypted = await this.encrypt(JSON.stringify(sessionData));
      sessionStorage.setItem(`secure_v2_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  }

  async getSecureItem(key: string): Promise<any | null> {
    try {
      const encrypted = sessionStorage.getItem(`secure_v2_${key}`);
      if (!encrypted) return null;

      const decrypted = await this.decrypt(encrypted);
      if (!decrypted) {
        this.removeSecureItem(key);
        return null;
      }

      const sessionData: SessionData = JSON.parse(decrypted);
      
      if (Date.now() > sessionData.timestamp) {
        this.removeSecureItem(key);
        return null;
      }

      if (sessionData.sessionId !== this.sessionId) {
        this.removeSecureItem(key);
        return null;
      }

      const serializedData = JSON.stringify(sessionData.data);
      const isIntegrityValid = await this.verifyIntegrity(serializedData, sessionData.integrity);
      
      if (!isIntegrityValid) {
        this.removeSecureItem(key);
        console.warn('Data integrity check failed, removing corrupted data');
        return null;
      }

      return sessionData.data;
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      this.removeSecureItem(key);
      return null;
    }
  }

  removeSecureItem(key: string): void {
    sessionStorage.removeItem(`secure_v2_${key}`);
  }

  async clearAllSecureItems(): Promise<void> {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.startsWith('secure_v2_') || key.startsWith('secure_')) {
        sessionStorage.removeItem(key);
      }
    }
    
    await this.initializeSession();
  }

  async cleanup(): Promise<void> {
    const keys = Object.keys(sessionStorage);
    
    for (const key of keys) {
      if (key.startsWith('secure_v2_')) {
        const item = await this.getSecureItem(key.replace('secure_v2_', ''));
        if (item === null) {
          sessionStorage.removeItem(key);
        }
      }
    }
  }
}

export const secureSessionManager = SecureSessionManager.getInstance();

if (typeof window !== 'undefined') {
  secureSessionManager.cleanup();
  
  window.addEventListener('beforeunload', () => {
    secureSessionManager.clearAllSecureItems();
  });
  
  setInterval(() => {
    secureSessionManager.cleanup();
  }, 300000);
}