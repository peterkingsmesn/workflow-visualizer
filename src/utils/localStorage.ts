interface LocalStorageOptions {
  prefix?: string;
  version?: string;
}

class LocalStorage {
  private prefix: string;
  private version: string;

  constructor(options: LocalStorageOptions = {}) {
    this.prefix = options.prefix || 'workflow-visualizer';
    this.version = options.version || '1.0';
  }

  private getKey(key: string): string {
    return `${this.prefix}:${this.version}:${key}`;
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = window.localStorage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return defaultValue;
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  has(key: string): boolean {
    return window.localStorage.getItem(this.getKey(key)) !== null;
  }

  /**
   * Get all keys with the current prefix
   */
  keys(): string[] {
    const keys: string[] = [];
    const prefixLength = this.getKey('').length;
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(prefixLength));
      }
    }
    
    return keys;
  }

  /**
   * Get the size of stored data in bytes
   */
  getSize(): number {
    let size = 0;
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const value = window.localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }
    
    return size * 2; // Rough estimate (UTF-16)
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Migrate data from old version
   */
  migrate(oldVersion: string, migrationFn: (data: any) => any): void {
    const oldPrefix = `${this.prefix}:${oldVersion}`;
    const keysToMigrate: string[] = [];
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(oldPrefix)) {
        keysToMigrate.push(key);
      }
    }
    
    keysToMigrate.forEach(oldKey => {
      try {
        const oldData = window.localStorage.getItem(oldKey);
        if (oldData) {
          const parsed = JSON.parse(oldData);
          const migrated = migrationFn(parsed);
          const newKey = oldKey.replace(oldPrefix, `${this.prefix}:${this.version}`);
          window.localStorage.setItem(newKey, JSON.stringify(migrated));
          window.localStorage.removeItem(oldKey);
        }
      } catch (error) {
        console.error('Failed to migrate data:', error);
      }
    });
  }
}

export const localStorage = new LocalStorage();