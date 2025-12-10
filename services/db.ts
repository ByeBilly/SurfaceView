
import { INITIAL_PRODUCTS, EXAMPLE_ROOMS } from '../constants';
import { BusinessProfile, Job, Product, SampleRoom } from '../types';

const DB_NAME = 'SurfaceViewDB_v2'; // Bumped version for new schema
const DB_VERSION = 1;

class SurfaceViewDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.openDB();
  }

  // Ensure DB is open before any operation
  private async ready() {
    await this.initPromise;
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  private openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('DB Open Error', event);
        reject('Failed to open database');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create Stores
        if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('jobs')) db.createObjectStore('jobs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sample_rooms')) db.createObjectStore('sample_rooms', { keyPath: 'id' });
        
        // The "Assets" store acts as our File System
        if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath: 'id' });
      };
    });
  }

  // --- GENERIC HELPERS ---
  
  private async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- SPECIFIC METHODS ---

  // 1. Assets (The "File System")
  async saveAsset(file: Blob | File): Promise<string> {
    const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Store the blob directly
    await this.put('assets', { id, blob: file, createdAt: Date.now() });
    return id;
  }

  async getAssetBlob(id: string): Promise<Blob | null> {
    const record = await this.get<{id: string, blob: Blob}>('assets', id);
    return record ? record.blob : null;
  }

  async getAssetUrl(id: string): Promise<string> {
    const blob = await this.getAssetBlob(id);
    if (!blob) return '';
    return URL.createObjectURL(blob);
  }

  // 2. Profile
  async hasSeenWelcome(): Promise<boolean> {
    return localStorage.getItem('sv_welcome_seen') === 'true';
  }

  async markWelcomeSeen() {
    localStorage.setItem('sv_welcome_seen', 'true');
  }

  async getProfile(): Promise<BusinessProfile> {
    const profile = await this.get<BusinessProfile & { id: string }>('profile', 'main');
    if (profile) return profile;
    return {
      businessName: 'My Business',
      contactName: 'Guest User',
      phone: '',
      email: '',
      address: '',
      isSetup: false
    };
  }

  async saveProfile(profile: BusinessProfile) {
    await this.put('profile', { ...profile, id: 'main', isSetup: true });
  }

  // 3. Products
  async getProducts(): Promise<Product[]> {
    const products = await this.getAll<Product>('products');
    if (products.length === 0) {
      // Seed initial data
      await this.seedData();
      return this.getAll<Product>('products');
    }
    return products;
  }

  async saveProduct(product: Product) {
    await this.put('products', product);
  }

  async deleteProduct(id: string) {
    await this.delete('products', id);
  }

  // 4. Jobs
  async getJobs(): Promise<Job[]> {
    return this.getAll<Job>('jobs');
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.get<Job>('jobs', id);
  }

  async saveJob(job: Job) {
    await this.put('jobs', job);
  }

  async deleteJob(id: string) {
    await this.delete('jobs', id);
  }

  // 5. Sample Rooms
  async getSampleRooms(): Promise<SampleRoom[]> {
    const rooms = await this.getAll<SampleRoom>('sample_rooms');
    // Also include defaults if needed, but usually we just keep user ones in DB
    return rooms;
  }

  async saveSampleRoom(room: SampleRoom) {
    await this.put('sample_rooms', room);
  }

  async deleteSampleRoom(id: string) {
    await this.delete('sample_rooms', id);
  }

  // Seed Logic
  private async seedData() {
    // Seed Products
    for (const p of INITIAL_PRODUCTS) {
      await this.put('products', p);
    }
    // We could seed example rooms into sample_rooms store, 
    // but constants.ts EXAMPLE_ROOMS are web URLs so we can keep them separate 
    // or insert them here. Let's keep them in constants for simplicity.
  }
}

export const db = new SurfaceViewDB();
