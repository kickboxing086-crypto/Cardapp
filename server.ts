import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import { Product, StoreSettings, Order, OrderStatus } from './src/types';

import webpush from 'web-push';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface StoreData {
  id: string;
  email: string;
  username?: string;
  password: string;
  settings: StoreSettings;
  products: Product[];
  orders: Order[];
  createdAt?: string;
  pushSubscriptions?: PushSubscriptionData[];
  vapidKeys?: { publicKey: string, privateKey: string };
  updatedAtLocal?: number;
  lastSavedToFirestore?: number;
}

const DATA_FILE = path.join(process.cwd(), 'app_data.json');

let stores = new Map<string, StoreData>();

// Read Firebase config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firestoreConfig: any = null;
if (fs.existsSync(configPath)) {
  try {
    firestoreConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('[Firebase REST] Loaded Firestore config for REST API:', firestoreConfig.projectId);
  } catch (err) {
    console.error('[Firebase REST] Error reading config file:', err);
  }
} else {
  console.warn('[Firebase REST] Config file not found. Running with local fallback.');
}

// REST Helper function: Convert JS object to Firestore Proto fields representation
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (typeof val === 'number') {
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(val)
      }
    };
  }
  return { stringValue: String(val) };
}

// REST Helper function: Convert Firestore Proto fields representation to standard JS object
function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields || {})) {
    res[k] = fromFirestoreValue(v);
  }
  return res;
}

function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    return fromFirestoreFields(val.mapValue.fields || {});
  }
  return null;
}

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      stores = new Map<string, StoreData>(parsed);
      return;
    } catch (e) {
      console.error('Error loading data locally:', e);
    }
  }
  
  // Default store if no file exists
  stores.set('barraca-do-samuel', {
    id: 'barraca-do-samuel',
    email: 'elitestreambr1@gmail.com',
    password: '86113980',
    settings: {
      storeName: 'Barraca do Samuel',
      logo: '/logo.png',
      primaryColor: '#22c55e',
      whatsappNumber: '5584986113980',
      storeSlug: 'barraca-do-samuel'
    },
    products: [],
    orders: []
  });
  saveDataLocalOnly();
}

function saveDataLocalOnly() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(stores.entries()), null, 2));
  } catch (e) {
    console.error('Error saving data locally:', e);
  }
}

// --- PLATFORM TRANSACTIONS (REVENUE/BILLING HISTORY) ---
let transactions: Array<any> = [];
const TX_FILE = path.join(process.cwd(), 'app_transactions.json');

function saveTransactionsLocal() {
  try {
    fs.writeFileSync(TX_FILE, JSON.stringify(transactions, null, 2));
  } catch (e) {
    console.error('Error saving transactions locally:', e);
  }
}

function loadTransactionsLocal() {
  if (fs.existsSync(TX_FILE)) {
    try {
      transactions = JSON.parse(fs.readFileSync(TX_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error loading transactions locally:', e);
    }
  } else {
    const now = new Date();
    
    // Create dates for past months and current month
    const d1 = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 2), 10, 0, 0).toISOString();
    const d2 = new Date(now.getFullYear(), now.getMonth() - 1, 15, 14, 30, 0).toISOString();
    const d3 = new Date(now.getFullYear(), now.getMonth() - 1, 20, 9, 15, 0).toISOString();
    const d4 = new Date(now.getFullYear(), now.getMonth() - 2, 10, 16, 45, 0).toISOString();
    const d5 = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1), 11, 20, 0).toISOString();
    const d6 = new Date(now.getFullYear(), now.getMonth() - 1, 28, 18, 10, 0).toISOString();
    const d7 = now.toISOString();

    transactions = [
      { id: 'tx-1-seed', storeId: 'barraca-do-samuel', storeName: 'Barraca do Samuel', planType: 'monthly', amount: 24.90, date: d1 },
      { id: 'tx-2-seed', storeId: 'barraca-do-samuel', storeName: 'Barraca do Samuel', planType: 'monthly', amount: 24.90, date: d2 },
      { id: 'tx-3-seed', storeId: 'pizza-italia', storeName: 'Pizzaria Bella Italia', planType: 'quarterly', amount: 59.90, date: d3 },
      { id: 'tx-4-seed', storeId: 'crisp-burger', storeName: 'Burguer Crisp', planType: 'annual', amount: 199.90, date: d4 },
      { id: 'tx-5-seed', storeId: 'villa-acai', storeName: 'Açaí da Villa', planType: 'monthly', amount: 24.90, date: d5 },
      { id: 'tx-6-seed', storeId: 'king-pastel', storeName: 'Pastelaria King', planType: 'semiannual', amount: 109.90, date: d6 },
      { id: 'tx-7-seed', storeId: 'sushi-prime', storeName: 'Sushi Prime', planType: 'monthly', amount: 24.90, date: d7 }
    ];
    saveTransactionsLocal();
  }
}

async function syncTransactionsFromFirestore() {
  if (!firestoreConfig) return;
  const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/transactions?key=${apiKey}`;
  try {
    const res = await fetch(url);
    if (res.status === 200) {
      const listData = await res.json() as any;
      if (listData.documents && Array.isArray(listData.documents)) {
        const fetchedTxList = [];
        for (const doc of listData.documents) {
          const fields = doc.fields;
          if (fields) {
            const txObj = fromFirestoreFields(fields);
            fetchedTxList.push(txObj);
          }
        }
        if (fetchedTxList.length > 0) {
          transactions = fetchedTxList;
          saveTransactionsLocal();
        }
      }
    }
  } catch (e) {
    console.error('[Firebase REST] Error syncing transactions:', e);
  }
}

async function saveTransactionToFirestore(tx: any) {
  saveTransactionsLocal();
  if (!firestoreConfig) return;
  const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/transactions/${tx.id}?key=${apiKey}`;
  try {
    const fields = toFirestoreFields(tx);
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (e) {
    console.error('[Firebase REST] Error saving tx to Firestore:', e);
  }
}

async function deleteTransactionFromFirestore(txId: string) {
  if (!firestoreConfig) return;
  const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/transactions/${txId}?key=${apiKey}`;
  try {
    await fetch(url, { method: 'DELETE' });
  } catch (e) {
    console.error('[Firebase REST] Error deleting tx from Firestore:', e);
  }
}

// Synchronizes a single store from Firestore to local memory Map
async function syncStore(storeId: string): Promise<StoreData | undefined> {
  const localStore = stores.get(storeId);
  if (!firestoreConfig) return localStore;
  
  const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/stores/${storeId}?key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    if (res.status === 200) {
      const data = await res.json() as any;
      if (data.fields) {
        const storeObj = fromFirestoreFields(data.fields) as StoreData;
        
        // Smart Sync Protection: If local store has unsaved local changes (localTime > lastSavedTime),
        // do not overwrite with old data from Firestore.
        if (localStore) {
          const localTime = localStore.updatedAtLocal || 0;
          const lastSavedTime = localStore.lastSavedToFirestore || 0;
          if (localTime > lastSavedTime) {
            console.log(`[Firebase REST] Protecting local changes for ${storeId} (Local: ${localTime}, lastSaved: ${lastSavedTime})`);
            return localStore;
          }
        }
        
        stores.set(storeId, storeObj);
        saveDataLocalOnly();
        return storeObj;
      }
    }
  } catch (e) {
    console.error(`[Firebase REST] Error syncing store ${storeId}:`, e);
  }
  return localStore;
}

// Query store by email, syncing all matching stores from Firestore to find the correct one
async function queryStoreByEmail(email: string): Promise<StoreData | undefined> {
  const normEmail = (email || '').toLowerCase().trim();
  if (!normEmail) return undefined;

  // We always query Firestore to ensure we have all matching stores synced
  if (firestoreConfig) {
    const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents:runQuery?key=${apiKey}`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "stores" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "email" },
            op: "EQUAL",
            value: { stringValue: normEmail }
          }
        }
      }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      });
      if (res.status === 200) {
        const resData = await res.json() as any;
        if (Array.isArray(resData)) {
          for (const item of resData) {
            if (item.document && item.document.fields) {
              const storeObj = fromFirestoreFields(item.document.fields) as StoreData;
              // Only overwrite local memory if we don't have newer unsaved local changes
              const localStore = stores.get(storeObj.id);
              if (localStore) {
                const localTime = localStore.updatedAtLocal || 0;
                const lastSavedTime = localStore.lastSavedToFirestore || 0;
                if (localTime > lastSavedTime) {
                  continue;
                }
              }
              stores.set(storeObj.id, storeObj);
            }
          }
          saveDataLocalOnly();
        }
      }
    } catch (e) {
      console.error(`[Firebase REST] Error querying store by email ${normEmail}:`, e);
    }
  }

  // Search locally (which now includes any newly synced stores)
  const localStores = Array.from(stores.values()).filter(s => s.email?.toLowerCase().trim() === normEmail);
  if (localStores.length > 0) {
    // Prefer non-seed store if multiple stores match
    return localStores.find(s => s.id !== 'barraca-do-samuel') || localStores[0];
  }

  return undefined;
}

// Query store by username
async function queryStoreByUsername(username: string): Promise<StoreData | undefined> {
  const normUser = (username || '').toLowerCase().trim();
  if (!normUser) return undefined;

  if (firestoreConfig) {
    const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents:runQuery?key=${apiKey}`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "stores" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "username" },
            op: "EQUAL",
            value: { stringValue: normUser }
          }
        }
      }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody)
      });
      if (res.status === 200) {
        const resData = await res.json() as any;
        if (Array.isArray(resData)) {
          for (const item of resData) {
            if (item.document && item.document.fields) {
              const storeObj = fromFirestoreFields(item.document.fields) as StoreData;
              const localStore = stores.get(storeObj.id);
              if (localStore) {
                const localTime = localStore.updatedAtLocal || 0;
                const lastSavedTime = localStore.lastSavedToFirestore || 0;
                if (localTime > lastSavedTime) {
                  continue;
                }
              }
              stores.set(storeObj.id, storeObj);
            }
          }
          saveDataLocalOnly();
        }
      }
    } catch (e) {
      console.error(`[Firebase REST] Error querying store by username ${normUser}:`, e);
    }
  }

  const localStores = Array.from(stores.values()).filter(s => s.username?.toLowerCase().trim() === normUser);
  if (localStores.length > 0) {
    return localStores.find(s => s.id !== 'barraca-do-samuel') || localStores[0];
  }

  return undefined;
}

// Check if slug is taken by another store in Firestore
async function isStoreSlugTaken(slug: string, currentStoreId: string): Promise<boolean> {
  const norm = slug.toLowerCase().trim();
  const localTaken = Array.from(stores.values()).some(s => s.id !== currentStoreId && (s.settings.storeSlug?.toLowerCase().trim() === norm || s.id?.toLowerCase().trim() === norm));
  if (localTaken) return true;
  
  if (!firestoreConfig) return false;
  
  const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents:runQuery?key=${apiKey}`;
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: "stores" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "settings.storeSlug" },
          op: "EQUAL",
          value: { stringValue: norm }
        }
      },
      limit: 1
    }
  };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody)
    });
    if (res.status === 200) {
      const resData = await res.json() as any;
      if (Array.isArray(resData)) {
        for (const item of resData) {
          if (item.document && item.document.fields) {
            const storeObj = fromFirestoreFields(item.document.fields) as StoreData;
            if (storeObj.id !== currentStoreId) {
              return true;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error(`[Firebase REST] Error checking slug taken for ${norm}:`, e);
  }
  return false;
}

// Saves a store document to Firestore
async function saveStoreToFirestore(storeId: string, data: StoreData): Promise<boolean> {
  data.updatedAtLocal = Date.now();
  stores.set(storeId, data);
  saveDataLocalOnly();
  if (!firestoreConfig) return true;
  
  const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/stores/${storeId}?key=${apiKey}`;
  
  try {
    // Sanitizes any undefined fields to prevent Firestore write errors
    const cleanData = JSON.parse(JSON.stringify(data));
    const fields = toFirestoreFields(cleanData);
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    
    if (res.status === 200) {
      console.log(`[Firebase REST] Saved store ${storeId} to Firestore.`);
      data.lastSavedToFirestore = Date.now();
      stores.set(storeId, data);
      saveDataLocalOnly();
      return true;
    } else {
      const err = await res.json() as any;
      console.error(`[Firebase REST] Failed to save store ${storeId} to Firestore:`, err);
      return false;
    }
  } catch (e) {
    console.error(`[Firebase REST] Error saving store ${storeId}:`, e);
    return false;
  }
}

// Looks up a store by slug or by ID, syncing from Firestore if available
async function syncStoreBySlugOrId(slugOrId: string): Promise<StoreData | undefined> {
  const norm = slugOrId.toLowerCase().trim();
  
  if (!firestoreConfig) {
    return Array.from(stores.values()).find(s => s.settings.storeSlug?.toLowerCase().trim() === norm || s.id?.toLowerCase().trim() === norm);
  }
  
  try {
    // 1. Try fetching by ID directly
    const directStore = await syncStore(norm);
    if (directStore) return directStore;
    
    // 2. Try querying by settings.storeSlug
    const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents:runQuery?key=${apiKey}`;
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "stores" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "settings.storeSlug" },
            op: "EQUAL",
            value: { stringValue: norm }
          }
        },
        limit: 1
      }
    };
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody)
    });
    
    if (res.status === 200) {
      const resData = await res.json() as any;
      if (Array.isArray(resData)) {
        for (const item of resData) {
          if (item.document && item.document.fields) {
            const storeObj = fromFirestoreFields(item.document.fields) as StoreData;
            
            // Smart Sync Protection: If local store has unsaved local changes (localTime > lastSavedTime),
            // do not overwrite with old data from Firestore.
            const localStore = stores.get(storeObj.id);
            if (localStore) {
              const localTime = localStore.updatedAtLocal || 0;
              const lastSavedTime = localStore.lastSavedToFirestore || 0;
              if (localTime > lastSavedTime) {
                console.log(`[Firebase REST] Protecting local changes for ${storeObj.id} via slug query (Local: ${localTime}, lastSaved: ${lastSavedTime})`);
                return localStore;
              }
            }
            
            stores.set(storeObj.id, storeObj);
            saveDataLocalOnly();
            return storeObj;
          }
        }
      }
    }
  } catch (e) {
    console.error(`[Firebase REST] Error fetching store ${norm} by slug/id:`, e);
  }
  
  return Array.from(stores.values()).find(s => s.settings.storeSlug?.toLowerCase().trim() === norm || s.id?.toLowerCase().trim() === norm);
}

loadData();
loadTransactionsLocal();

// Background bidirectional sync of stores on startup
async function syncAllLocalStoresToFirestore() {
  if (!firestoreConfig) return;
  console.log('[Firebase REST] Starting background sync of local stores with Firestore...');
  for (const [storeId, storeData] of stores.entries()) {
    try {
      const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/stores/${storeId}?key=${apiKey}`;
      const res = await fetch(url);
      if (res.status === 404) {
        console.log(`[Firebase REST] Local store ${storeId} not found in Firestore. Uploading...`);
        await saveStoreToFirestore(storeId, storeData);
      } else if (res.status === 200) {
        const data = await res.json() as any;
        if (data.fields) {
          const fsStore = fromFirestoreFields(data.fields) as StoreData;
          const localTime = storeData.updatedAtLocal || 0;
          const fsTime = fsStore.updatedAtLocal || 0;
          
          if (localTime > fsTime) {
            console.log(`[Firebase REST] Local store ${storeId} is newer than Firestore. Updating Firestore...`);
            await saveStoreToFirestore(storeId, storeData);
          } else if (fsTime > localTime) {
            // Safety Guard: If local has products but Firestore has none, preserve local products
            if (storeData.products && storeData.products.length > 0 && (!fsStore.products || fsStore.products.length === 0)) {
              console.log(`[Firebase REST] Safety: Local store ${storeId} has products but Firestore has none. Preserving local products.`);
              fsStore.products = storeData.products;
            }
            // Safety Guard: If local has categories but Firestore has none, preserve local categories
            if (storeData.settings?.categories && storeData.settings.categories.length > 0 && (!fsStore.settings?.categories || fsStore.settings.categories.length === 0)) {
              console.log(`[Firebase REST] Safety: Local store ${storeId} has categories but Firestore has none. Preserving local categories.`);
              if (!fsStore.settings) fsStore.settings = { ...storeData.settings };
              fsStore.settings.categories = storeData.settings.categories;
            }
            console.log(`[Firebase REST] Firestore store ${storeId} is newer than Local. Updating Local...`);
            stores.set(storeId, fsStore);
            saveDataLocalOnly();
          }
        }
      }
    } catch (e) {
      console.error(`[Firebase REST] Error syncing store ${storeId} on startup:`, e);
    }
  }
  console.log('[Firebase REST] Background sync of local stores completed.');
}

setTimeout(() => {
  syncAllLocalStoresToFirestore().catch(err => {
    console.error('[Firebase REST] Error in syncAllLocalStoresToFirestore:', err);
  });
}, 3000);

// Helper to generate 8-char protocol
function generateProtocol(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  // Generate first 5 chars randomly (mix of letters and numbers)
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Generate last 3 chars as letters (for security/verification code)
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// --- CUSTOMER ROUTES ---

app.get('/api/stores/:slugOrId/settings', async (req, res) => {
  const param = req.params.slugOrId?.toLowerCase().trim();
  const store = await syncStoreBySlugOrId(param);
  if (!store) return res.status(404).json({ error: `Loja não encontrada. (${param})` });
  res.json({ ...store.settings, createdAt: store.createdAt || new Date().toISOString() });
});

app.get('/api/stores/:slugOrId/logo', async (req, res) => {
  const param = req.params.slugOrId?.toLowerCase().trim();
  const store = await syncStoreBySlugOrId(param);
  if (!store || !store.settings.logo) {
    return res.redirect('/logo.png');
  }

  const logoStr = store.settings.logo;
  if (logoStr.startsWith('data:image/') || logoStr.includes(';base64,')) {
    const parts = logoStr.split(';base64,');
    if (parts.length === 2) {
      const contentType = parts[0].replace('data:', '');
      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      return res.end(buffer);
    }
  }

  if (logoStr.startsWith('http://') || logoStr.startsWith('https://')) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.redirect(logoStr);
  }

  return res.redirect('/logo.png');
});

app.get('/api/stores/:slugOrId/products', async (req, res) => {
  const param = req.params.slugOrId?.toLowerCase().trim();
  const store = await syncStoreBySlugOrId(param);
  if (!store) return res.status(404).json({ error: `Loja não encontrada. (${param})` });
  res.json(store.products);
});

app.get('/api/stores/:slugOrId/booked-slots', async (req, res) => {
  const param = req.params.slugOrId?.toLowerCase().trim();
  const date = req.query.date as string; // YYYY-MM-DD
  const store = await syncStoreBySlugOrId(param);
  if (!store) return res.status(404).json({ error: `Loja não encontrada. (${param})` });
  
  if (!date) return res.json([]);

  const manuallyBlocked = (store.settings?.manualBlockedSlots && store.settings.manualBlockedSlots[date]) || [];
  
  const bookedSlotsByOrders = store.settings?.blockTakenSlots ? store.orders
    .filter(o => o.scheduledDate === date && o.scheduledTime && o.status !== 'completed' && o.status !== 'canceled')
    .map(o => o.scheduledTime as string) : [];
    
  res.json([...new Set([...bookedSlotsByOrders, ...manuallyBlocked])]);
});

app.post('/api/stores/:slugOrId/orders', async (req, res) => {
  try {
    const param = req.params.slugOrId?.toLowerCase().trim();
    const store = await syncStoreBySlugOrId(param);
    if (!store) return res.status(404).json({ error: `Loja não encontrada. (${param})` });
    
    const { customerName, customerPhone, deliveryMethod, paymentMethod, changeFor, observation, address, deliveryFee, deliveryZone, items, totalPrice, scheduledDate, scheduledTime } = req.body;

    if (!store.orders) store.orders = [];

    // Check if slot is already taken for scheduled orders
    if (scheduledTime && scheduledDate) {
      const isTakenByOrder = store.settings?.blockTakenSlots && store.orders.some(o => 
        o.scheduledTime === scheduledTime && 
        o.scheduledDate === scheduledDate &&
        o.status !== 'completed' && o.status !== 'canceled'
      );
      const isManuallyBlocked = store.settings?.manualBlockedSlots && store.settings.manualBlockedSlots[scheduledDate]?.includes(scheduledTime);
      
      if (isTakenByOrder || isManuallyBlocked) {
        return res.status(400).json({ error: 'Desculpe, este horário já foi preenchido. Por favor, escolha outro horário.' });
      }
    }

    // Create Order
    const newOrder: Order = {
      id: uuidv4(),
      protocol: generateProtocol(),
      customerName,
      customerPhone: customerPhone || 'Não informado',
      deliveryMethod,
      paymentMethod: paymentMethod || 'pix',
      changeFor: paymentMethod === 'cash' && changeFor ? Number(changeFor) : undefined,
      observation,
      address,
      deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : undefined,
      deliveryZone,
      items,
      totalPrice: Number(totalPrice),
      status: 'pending',
      createdAt: new Date().toISOString(),
      scheduledDate,
      scheduledTime
    };

    // Auto reduce stock immediately when order is reserved
    newOrder.stockReduced = true;
    if (store.products) {
      for (const item of items) {
        const product = store.products.find(p => p.id === item.productId);
        if (product && product.stockCount !== undefined) {
          product.stockCount = Math.max(0, product.stockCount - item.quantity);
        }
      }
    }
    
    if (!store.orders) store.orders = [];
    store.orders.push(newOrder);
    await saveStoreToFirestore(store.id, store);

    // Send push notifications
    if (store.vapidKeys && store.pushSubscriptions && store.pushSubscriptions.length > 0) {
      try {
        const pushOptions = {
          vapidDetails: {
            subject: 'mailto:admin@cardapp.com',
            publicKey: store.vapidKeys.publicKey,
            privateKey: store.vapidKeys.privateKey
          },
          TTL: 86400, // 24 hours
          headers: {
            'Urgency': 'high'
          }
        };

        // Avoid sending huge base64 files as icon in Web Push payload as it exceeds the 4KB limit and drops notifications
        let pushIcon = '/logo.png';
        if (store.settings?.logo && !store.settings.logo.startsWith('data:')) {
          pushIcon = store.settings.logo;
        } else if (store.settings?.storeSlug) {
          pushIcon = `/api/stores/${store.settings.storeSlug}/logo`;
        }

        const payload = JSON.stringify({
          title: '📦 Novo Pedido Recebido!',
          body: `Pedido #${newOrder.protocol || newOrder.id.substring(0, 5)} - R$ ${Number(newOrder.totalPrice).toFixed(2)}\nCliente: ${newOrder.customerName}`,
          icon: pushIcon,
          url: `/admin`
        });

        console.log(`[Push Notification] Sending to ${store.pushSubscriptions.length} subscriptions for store ${store.id}`);

        store.pushSubscriptions.forEach((subscription: any) => {
          webpush.sendNotification(subscription, payload, pushOptions).catch((error: any) => {
            console.error('[Push Notification] Error sending:', error.statusCode || error);
            if (error.statusCode === 410 || error.statusCode === 404) {
               console.log('[Push Notification] Removing invalid subscription');
               store.pushSubscriptions = store.pushSubscriptions?.filter((s: any) => s.endpoint !== subscription.endpoint);
               saveStoreToFirestore(store.id, store).catch(() => {});
            }
          });
        });
      } catch (pushErr) {
        console.error('Error in push notification setup:', pushErr);
      }
    } else {
      console.log(`[Push Notification] Skiping. Vapid: ${!!store.vapidKeys}, Subs: ${store.pushSubscriptions?.length || 0}`);
    }

    res.json(newOrder);
  } catch (error: any) {
    console.error('SERVER ERROR CREATING ORDER:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao processar o pedido. Por favor, tente novamente.' });
  }
});

app.post('/api/stores/:slugOrId/orders/:orderId/confirm-stock', async (req, res) => {
  const param = req.params.slugOrId?.toLowerCase().trim();
  const store = await syncStoreBySlugOrId(param);
  if (!store) return res.status(404).json({ error: `Loja não encontrada.` });
  
  const orderId = req.params.orderId;
  const order = store.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: `Pedido não encontrado.` });

  // Only reduce stock if it hasn't been reduced yet for this order (prevent double reduction if double clicked)
  if (order.stockReduced) {
    return res.json({ success: true, message: 'Estoque já reduzido.' });
  }

  // Stock Reduction logic moved here
  for (const item of order.items) {
    const product = store.products.find(p => p.id === item.productId);
    if (product && product.stockCount !== undefined) {
      // Reduce stock, but cap at 0
      product.stockCount = Math.max(0, product.stockCount - item.quantity);
    }
  }

  // Mark order as stock reduced
  order.stockReduced = true;
  
  await saveStoreToFirestore(store.id, store);
  res.json({ success: true });
});

app.get('/api/stores/:slugOrId/orders/:orderId', async (req, res) => {
  const param = req.params.slugOrId?.toLowerCase().trim();
  const store = await syncStoreBySlugOrId(param);
  if (!store) return res.status(404).json({ error: `Loja não encontrada.` });
  
  const order = store.orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: `Pedido não encontrado.` });
  
  res.json(order);
});

// --- ADMIN AUTH ROUTES ---

app.post('/api/login', async (req, res) => {
  const { email, username, password, storeId } = req.body;
  const identity = (email || username || '').toLowerCase().trim();
  
  // Super Admin Check (both user mail and default main store owner)
  const isSuperIdentity = identity === 'samuellsilvva02@gmail.com' || identity === 'kickboxing086@gmail.com' || identity === 'admin@cardapp.com' || identity === 'samuelsilva';
  
  // Sync matching stores to populate local cache
  await queryStoreByEmail(identity);
  await queryStoreByUsername(identity);
  await syncStoreBySlugOrId(identity);

  // Find all matching stores by email/username/ID with correct password
  const allMatchingStores = Array.from(stores.values()).filter(s => 
    (s.email?.toLowerCase().trim() === identity || 
     s.username?.toLowerCase().trim() === identity || 
     s.id?.toLowerCase().trim() === identity) &&
    s.password === password
  );

  const isSuperAdminPassword = password === 'admin123' || password === '86113980';
  const isValidSuperPassword = isSuperIdentity && isSuperAdminPassword;
  
  // Debug log details to a file for easy diagnosis
  try {
    const debugLine = `[${new Date().toISOString()}] Login Attempt: identity="${identity}", password="${password}", isSuperIdentity=${isSuperIdentity}, isSuperAdminPassword=${isSuperAdminPassword}, matchingStoresCount=${allMatchingStores.length}\n`;
    fs.appendFileSync('login_debug.log', debugLine);
  } catch (err) {
    console.error('Failed to write debug log:', err);
  }

  if (isValidSuperPassword) {
    let finalStoreId = allMatchingStores[0]?.id || '';
    if (!finalStoreId) {
      const activeIds = Array.from(stores.keys()).filter(id => id !== 'barraca-do-samuel');
      finalStoreId = activeIds[0] || 'super-admin';
    }
    return res.json({ 
      success: true, 
      token: 'super-admin-token', 
      storeId: finalStoreId,
      isSuperAdmin: true 
    });
  }

  if (allMatchingStores.length === 0) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // If a specific store ID is selected, or if there is only 1 matching store
  if (storeId) {
    const selectedStore = allMatchingStores.find(s => s.id === storeId);
    if (selectedStore) {
      return res.json({ success: true, token: selectedStore.id, storeId: selectedStore.id });
    }
  }

  if (allMatchingStores.length === 1) {
    const singleStore = allMatchingStores[0];
    return res.json({ success: true, token: singleStore.id, storeId: singleStore.id });
  }

  // Multiple matching stores! Return list for selector
  const storesList = allMatchingStores.map(s => ({
    id: s.id,
    name: s.settings?.storeName || s.id,
    slug: s.settings?.storeSlug || s.id,
    logo: s.settings?.logo || '/logo.png'
  }));

  return res.json({
    success: true,
    multiple: true,
    stores: storesList
  });
});

app.post('/api/register', async (req, res) => {
  const { email, username, password, storeName } = req.body;
  
  if ((!email && !username) || !password || !storeName) {
    return res.status(400).json({ error: 'Identificação (E-mail/Username), senha e nome da loja são obrigatórios' });
  }
  
  if (email) {
    const existingStore = await queryStoreByEmail(email);
    if (existingStore) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
    }
  }

  if (username) {
    const existingStore = await queryStoreByUsername(username);
    if (existingStore) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
    }
  }
  
  const newSlug = (storeName || 'nova-loja')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  // Ensure slug uniqueness
  const isTaken = await isStoreSlugTaken(newSlug, '');
  const newId = isTaken ? `${newSlug}-${Math.random().toString(36).substring(2, 6)}` : newSlug;
  
  const storeNameFirst = storeName.trim();
  
  const newStore: StoreData = {
    id: newId,
    email: email ? email.toLowerCase().trim() : '',
    username: username ? username.toLowerCase().trim() : '',
    password,
    settings: {
      storeName,
      logo: '/logo.png',
      storeNameFirst,
      storeNameFirstColor: '#1e293b',
      primaryColor: '#22c55e',
      whatsappNumber: '',
      storeSlug: newId,
      businessType: 'outros',
      categories: ['Geral'],
      locationAddress: '',
      isOpen: true,
      fontFamily: 'inter',
      planType: 'free',
      planStartDate: new Date().toISOString()
    },
    products: [],
    orders: [],
    createdAt: new Date().toISOString()
  };
  
  stores.set(newId, newStore);
  await saveStoreToFirestore(newId, newStore);
  res.json({ success: true, storeId: newId });
});

// --- ADMIN MIDDLEWARE ---
const adminAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  
  const store = await syncStore(token);
  if (!store) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  req.storeId = token;
  req.storeData = store;
  next();
};

// --- ADMIN API ROUTES ---

app.get('/api/admin/push/vapid-key', adminAuth, async (req: any, res: any) => {
  const store = req.storeData;
  if (!store.vapidKeys) {
    store.vapidKeys = webpush.generateVAPIDKeys();
    await saveStoreToFirestore(req.storeId, store);
  }
  res.json({ publicKey: store.vapidKeys.publicKey });
});

app.post('/api/admin/push/subscribe', adminAuth, async (req: any, res: any) => {
  const store = req.storeData;
  const subscription = req.body;

  if (!store.pushSubscriptions) {
    store.pushSubscriptions = [];
  }
  
  // Check if already subscribed
  const exists = store.pushSubscriptions.find((sub: any) => sub.endpoint === subscription.endpoint);
  if (!exists) {
    store.pushSubscriptions.push(subscription);
    await saveStoreToFirestore(req.storeId, store);
  }

  res.status(201).json({});
});

app.post('/api/admin/push/unsubscribe', adminAuth, async (req: any, res: any) => {
  const store = req.storeData;
  const { endpoint } = req.body;
  if (store.pushSubscriptions) {
    store.pushSubscriptions = store.pushSubscriptions.filter((sub: any) => sub.endpoint !== endpoint);
    await saveStoreToFirestore(req.storeId, store);
  }
  res.status(200).json({});
});

app.get('/api/admin/settings', adminAuth, (req: any, res: any) => {
  res.json(req.storeData.settings);
});

app.put('/api/admin/settings', adminAuth, async (req: any, res: any) => {
  const { 
    storeName, 
    primaryColor, 
    whatsappNumber, 
    storeSlug, 
    openingHours, 
    logo,
    storeNameFirst,
    storeNameFirstColor,
    businessType,
    categories,
    locationAddress,
    isOpen,
    fontFamily,
    openingTime,
    closingTime,
    is24Hours,
    ceoName,
    description,
    storeTagline,
    acceptedPaymentMethods,
    deliveryTime,
    printMode
  } = req.body;
  
  if (storeSlug !== undefined) {
    // Check if slug is taken by another store
    const isTaken = await isStoreSlugTaken(storeSlug, req.storeId);
    if (isTaken) {
      return res.status(400).json({ error: 'Este link já está em uso' });
    }
    req.storeData.settings.storeSlug = storeSlug;
  }
  
  if (storeName !== undefined) req.storeData.settings.storeName = storeName;
  if (primaryColor !== undefined) req.storeData.settings.primaryColor = primaryColor;
  if (whatsappNumber !== undefined) req.storeData.settings.whatsappNumber = whatsappNumber;
  if (openingHours !== undefined) req.storeData.settings.openingHours = openingHours;
  if (logo !== undefined) req.storeData.settings.logo = logo;
  if (storeNameFirst !== undefined) req.storeData.settings.storeNameFirst = storeNameFirst;
  if (storeNameFirstColor !== undefined) req.storeData.settings.storeNameFirstColor = storeNameFirstColor;
  if (businessType !== undefined) req.storeData.settings.businessType = businessType;
  if (categories !== undefined) req.storeData.settings.categories = categories;
  if (locationAddress !== undefined) req.storeData.settings.locationAddress = locationAddress;
  if (isOpen !== undefined) req.storeData.settings.isOpen = isOpen;
  if (fontFamily !== undefined) req.storeData.settings.fontFamily = fontFamily;
  if (req.body.customerFontSize !== undefined) req.storeData.settings.customerFontSize = req.body.customerFontSize;
  if (req.body.headerFontSize !== undefined) req.storeData.settings.headerFontSize = req.body.headerFontSize;
  if (req.body.deliveryFees !== undefined) req.storeData.settings.deliveryFees = req.body.deliveryFees;
  if (openingTime !== undefined) req.storeData.settings.openingTime = openingTime;
  if (closingTime !== undefined) req.storeData.settings.closingTime = closingTime;
  if (is24Hours !== undefined) req.storeData.settings.is24Hours = is24Hours;
  if (req.body.blockOutsideDelivery !== undefined) req.storeData.settings.blockOutsideDelivery = req.body.blockOutsideDelivery;
  if (req.body.storeType !== undefined) req.storeData.settings.storeType = req.body.storeType;
  if (req.body.weeklySchedules !== undefined) req.storeData.settings.weeklySchedules = req.body.weeklySchedules;
  if (req.body.coverImage !== undefined) req.storeData.settings.coverImage = req.body.coverImage;
  if (req.body.minimumOrderValue !== undefined) req.storeData.settings.minimumOrderValue = Number(req.body.minimumOrderValue);
  if (req.body.productOrder !== undefined) req.storeData.settings.productOrder = req.body.productOrder;
  if (req.body.instagramUrl !== undefined) req.storeData.settings.instagramUrl = req.body.instagramUrl;
  if (req.body.facebookUrl !== undefined) req.storeData.settings.facebookUrl = req.body.facebookUrl;
  if (req.body.websiteUrl !== undefined) req.storeData.settings.websiteUrl = req.body.websiteUrl;
  if (req.body.allowScheduling !== undefined) req.storeData.settings.allowScheduling = req.body.allowScheduling;
  if (req.body.schedulingDate !== undefined) req.storeData.settings.schedulingDate = req.body.schedulingDate;
  if (req.body.blockTakenSlots !== undefined) req.storeData.settings.blockTakenSlots = req.body.blockTakenSlots;
  if (req.body.customTimeSlots !== undefined) req.storeData.settings.customTimeSlots = req.body.customTimeSlots;
  if (req.body.manualBlockedSlots !== undefined) req.storeData.settings.manualBlockedSlots = req.body.manualBlockedSlots;
  
  if (ceoName !== undefined) req.storeData.settings.ceoName = ceoName;
  if (description !== undefined) req.storeData.settings.description = description;
  if (storeTagline !== undefined) req.storeData.settings.storeTagline = storeTagline;
  if (acceptedPaymentMethods !== undefined) req.storeData.settings.acceptedPaymentMethods = acceptedPaymentMethods;
  if (deliveryTime !== undefined) req.storeData.settings.deliveryTime = deliveryTime;
  if (printMode !== undefined) req.storeData.settings.printMode = printMode;
  
  const saved = await saveStoreToFirestore(req.storeId, req.storeData);
  if (!saved) {
    return res.status(500).json({ error: 'Erro ao salvar no Firestore. Verifique se o tamanho dos arquivos ou imagens não excedeu o limite do Firestore.' });
  }
  res.json(req.storeData.settings);
});

app.get('/api/admin/products', adminAuth, (req: any, res: any) => {
  res.json(req.storeData.products);
});

app.post('/api/admin/products', adminAuth, async (req: any, res: any) => {
  const { name, description, price, unit, image, promotion, category, addons, flavors, unavailableFlavors, isAvailable, stockCount, stockUnit, promoQuantity, promoPrice, promoGroup } = req.body;
  const newProduct: Product = {
    id: uuidv4(),
    name,
    description,
    price: Number(price),
    unit: unit || 'UN',
    image,
    promotion: Boolean(promotion),
    category,
    addons: addons || [],
    flavors: flavors || [],
    unavailableFlavors: unavailableFlavors || [],
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    stockCount: stockCount !== undefined ? Number(stockCount) : undefined,
    stockUnit: stockUnit,
    promoQuantity: promoQuantity !== undefined ? Number(promoQuantity) : undefined,
    promoPrice: promoPrice !== undefined ? Number(promoPrice) : undefined,
    promoGroup: promoGroup
  };
  req.storeData.products.push(newProduct);
  const saved = await saveStoreToFirestore(req.storeId, req.storeData);
  if (!saved) {
    return res.status(500).json({ error: 'Erro ao salvar o produto no Firestore. Verifique se a imagem não é muito grande ou se excedeu o limite do banco de dados.' });
  }
  res.json(newProduct);
});

app.put('/api/admin/products/:id', adminAuth, async (req: any, res: any) => {
  const product = req.storeData.products.find((p: Product) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  const { name, description, price, unit, image, promotion, category, addons, flavors, unavailableFlavors, isAvailable, stockCount, stockUnit, promoQuantity, promoPrice, promoGroup } = req.body;
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (unit !== undefined) product.unit = unit;
  if (image !== undefined) product.image = image;
  if (promotion !== undefined) product.promotion = Boolean(promotion);
  if (category !== undefined) product.category = category;
  if (addons !== undefined) product.addons = addons;
  if (flavors !== undefined) product.flavors = flavors;
  if (unavailableFlavors !== undefined) product.unavailableFlavors = unavailableFlavors;
  if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);
  if (stockCount !== undefined) product.stockCount = stockCount !== null ? Number(stockCount) : undefined;
  if (stockUnit !== undefined) product.stockUnit = stockUnit;
  if (promoQuantity !== undefined) product.promoQuantity = promoQuantity !== null ? Number(promoQuantity) : undefined;
  if (promoPrice !== undefined) product.promoPrice = promoPrice !== null ? Number(promoPrice) : undefined;
  if (promoGroup !== undefined) product.promoGroup = promoGroup;
  
  const saved = await saveStoreToFirestore(req.storeId, req.storeData);
  if (!saved) {
    return res.status(500).json({ error: 'Erro ao atualizar o produto no Firestore. Verifique se a imagem não é muito grande.' });
  }
  res.json(product);
});

app.delete('/api/admin/products/:id', adminAuth, async (req: any, res: any) => {
  req.storeData.products = req.storeData.products.filter((p: Product) => p.id !== req.params.id);
  const saved = await saveStoreToFirestore(req.storeId, req.storeData);
  if (!saved) {
    return res.status(500).json({ error: 'Erro ao excluir o produto do Firestore.' });
  }
  res.json({ success: true });
});

app.get('/api/admin/orders', adminAuth, (req: any, res: any) => {
  const sortedOrders = [...req.storeData.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sortedOrders);
});

app.post('/api/admin/orders/manual', adminAuth, async (req: any, res: any) => {
  const { description, totalPrice, productId, quantity } = req.body;
  
  const items = [];
  let finalDescription = description || 'Venda registrada manualmente';
  
  if (productId && quantity) {
    const product = req.storeData.products.find((p: Product) => p.id === productId);
    if (product) {
      items.push({
        productId,
        quantity: Number(quantity)
      });
      if (!description) {
        finalDescription = `Venda direta no caixa: ${quantity}x ${product.name}`;
      }
      // Reduce Stock
      if (product.stockCount !== undefined) {
        const oldStock = Number(product.stockCount || 0);
        product.stockCount = Math.max(0, oldStock - Number(quantity));
        console.log(`[Manual Sale] Reduced stock for ${product.name} from ${oldStock} to ${product.stockCount}`);
      }
    }
  }

  const newOrder: Order = {
    id: uuidv4(),
    protocol: generateProtocol(),
    customerName: 'Venda Caixa/Balcão',
    customerPhone: 'N/A',
    deliveryMethod: 'pickup',
    paymentMethod: 'cash',
    items: items,
    totalPrice: Number(totalPrice) || 0,
    status: 'completed',
    createdAt: new Date().toISOString(),
    observation: finalDescription,
    stockReduced: true,
    scheduledDate: req.body.scheduledDate,
    scheduledTime: req.body.scheduledTime
  };
  req.storeData.orders.push(newOrder);
  await saveStoreToFirestore(req.storeId, req.storeData);
  res.json(newOrder);
});

app.put('/api/admin/orders/:id/status', adminAuth, async (req: any, res: any) => {
  const order = req.storeData.orders.find((o: Order) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const { status } = req.body;
  if (['pending', 'preparing', 'delivery', 'pickup', 'completed', 'canceled'].includes(status)) {
    // If transitioning to canceled: restore stock if it was previously reduced
    if (status === 'canceled' && order.stockReduced) {
      for (const item of order.items) {
        const product = req.storeData.products.find((p: Product) => p.id === item.productId);
        if (product && product.stockCount !== undefined) {
          const oldStock = Number(product.stockCount || 0);
          product.stockCount = oldStock + Number(item.quantity);
        }
      }
      order.stockReduced = false;
    }

    order.status = status as OrderStatus;
    
    // Auto-reduce stock if it wasn't reduced yet and status progresses to active stages
    if (!order.stockReduced && ['preparing', 'delivery', 'pickup', 'completed'].includes(status)) {
      for (const item of order.items) {
        const product = req.storeData.products.find((p: Product) => p.id === item.productId);
        if (product && product.stockCount !== undefined) {
          const oldStock = Number(product.stockCount || 0);
          product.stockCount = Math.max(0, oldStock - Number(item.quantity));
        }
      }
      order.stockReduced = true;
    }
    
    await saveStoreToFirestore(req.storeId, req.storeData);
    res.json(order);
  } else {
    res.status(400).json({ error: 'Invalid status' });
  }
});

app.put('/api/admin/orders/:id', adminAuth, async (req: any, res: any) => {
  const orderIndex = req.storeData.orders.findIndex((o: Order) => o.id === req.params.id);
  if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });
  
  const updatedOrder = req.body;
  // Deep merge or replace fields. Here we just update what's relevant for the admin edit modal
  if (updatedOrder.totalPrice !== undefined) req.storeData.orders[orderIndex].totalPrice = Number(updatedOrder.totalPrice);
  if (updatedOrder.items !== undefined) req.storeData.orders[orderIndex].items = updatedOrder.items;
  
  await saveStoreToFirestore(req.storeId, req.storeData);
  res.json(req.storeData.orders[orderIndex]);
});

app.delete('/api/admin/orders/:id', adminAuth, async (req: any, res: any) => {
  const orderIndex = req.storeData.orders.findIndex((o: Order) => o.id === req.params.id);
  if (orderIndex === -1) return res.status(404).json({ error: 'Pedido não encontrado' });
  
  req.storeData.orders.splice(orderIndex, 1);
  await saveStoreToFirestore(req.storeId, req.storeData);
  res.json({ success: true });
});


// --- SUPER ADMIN MIDDLEWARE ---
const superAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  
  const token = authHeader.split(' ')[1];
  if (token !== 'super-admin-token') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

// --- SUPER ADMIN ENDPOINTS ---

// List all stores
app.get('/api/super/stores', superAuth, async (req: any, res: any) => {
  if (firestoreConfig) {
    const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/stores?key=${apiKey}`;
    try {
      const fetchRes = await fetch(url);
      if (fetchRes.status === 200) {
        const listData = await fetchRes.json() as any;
        if (listData.documents && Array.isArray(listData.documents)) {
          for (const doc of listData.documents) {
            const fields = doc.fields;
            if (fields) {
              const storeObj = fromFirestoreFields(fields) as StoreData;
              stores.set(storeObj.id, storeObj);
            }
          }
          saveDataLocalOnly();
        }
      }
    } catch (e) {
      console.error('[Firebase REST] Error fetching all stores for Super Admin:', e);
    }
  }
  
  const allStores = Array.from(stores.values()).map(s => ({
    id: s.id,
    email: s.email,
    password: s.password,
    settings: {
      storeName: s.settings?.storeName || 'Sem Nome',
      storeSlug: s.settings?.storeSlug || s.id,
      planType: s.settings?.planType || 'free',
      planStartDate: s.settings?.planStartDate || new Date().toISOString(),
      primaryColor: s.settings?.primaryColor || '#22c55e'
    },
    createdAt: s.createdAt || new Date().toISOString()
  }));
  res.json(allStores);
});

// Create a new client/merchant store from general administrator panel
app.post('/api/super/stores', superAuth, async (req: any, res: any) => {
  const { email, username, password, storeName, planType } = req.body;
  
  if ((!email && !username) || !password || !storeName) {
    return res.status(400).json({ error: 'E-mail ou Usuário, senha e nome da loja são obrigatórios' });
  }
  
  if (email) {
    const existingStore = await queryStoreByEmail(email);
    if (existingStore) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
    }
  }

  if (username) {
    const existingStore = await queryStoreByUsername(username);
    if (existingStore) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso' });
    }
  }
  
  const newSlug = (storeName || 'nova-loja')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  // Ensure slug uniqueness
  const isTaken = await isStoreSlugTaken(newSlug, '');
  const newId = isTaken ? `${newSlug}-${Math.random().toString(36).substring(2, 6)}` : newSlug;
  
  const storeNameFirst = storeName.trim();
  
  const newStore: StoreData = {
    id: newId,
    email: email ? email.toLowerCase().trim() : '',
    username: username ? username.toLowerCase().trim() : '',
    password,
    settings: {
      storeName,
      logo: '/logo.png',
      storeNameFirst,
      storeNameFirstColor: '#1e293b',
      primaryColor: '#22c55e',
      whatsappNumber: '',
      storeSlug: newId,
      businessType: 'outros',
      categories: ['Geral'],
      locationAddress: '',
      isOpen: true,
      fontFamily: 'inter',
      planType: planType || 'free',
      planStartDate: new Date().toISOString()
    },
    products: [],
    orders: [],
    createdAt: new Date().toISOString()
  };
  
  stores.set(newId, newStore);
  await saveStoreToFirestore(newId, newStore);

  // Automatically record billing transaction if starting on a paid plan
  if (planType && planType !== 'free') {
    let amount = 24.90;
    if (planType === 'quarterly') amount = 59.90;
    else if (planType === 'semiannual') amount = 109.90;
    else if (planType === 'annual') amount = 199.90;

    const initialTx = {
      id: 'tx-' + uuidv4().substring(0, 8),
      storeId: newId,
      storeName: storeName,
      planType: planType,
      amount: amount,
      date: new Date().toISOString()
    };
    transactions.push(initialTx);
    await saveTransactionToFirestore(initialTx);
  }

  res.json({ success: true, storeId: newId, storeSlug: newId });
});

// Delete a store
app.delete('/api/super/stores/:id', superAuth, async (req: any, res: any) => {
  const storeId = req.params.id;
  if (storeId === 'barraca-do-samuel') {
    return res.status(400).json({ error: 'A loja principal não pode ser excluída!' });
  }
  
  stores.delete(storeId);
  saveDataLocalOnly();
  
  if (firestoreConfig) {
    const { projectId, firestoreDatabaseId, apiKey } = firestoreConfig;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/stores/${storeId}?key=${apiKey}`;
    try {
      await fetch(url, { method: 'DELETE' });
    } catch (e) {
      console.error(`[Firebase REST] Error deleting store document ${storeId}:`, e);
    }
  }
  
  res.json({ success: true });
});

// Edit store plan or credentials
app.put('/api/super/stores/:id', superAuth, async (req: any, res: any) => {
  const storeId = req.params.id;
  const store = stores.get(storeId) || await syncStore(storeId);
  if (!store) {
    return res.status(404).json({ error: 'Loja não encontrada.' });
  }
  
  const { planType, password, storeName } = req.body;
  
  if (planType !== undefined) {
    store.settings.planType = planType;
    store.settings.planStartDate = new Date().toISOString(); // Reset plan length

    // Automatically record billing transaction if a paid plan is set/renewed
    if (planType !== 'free') {
      let amount = 24.90;
      if (planType === 'quarterly') amount = 59.90;
      else if (planType === 'semiannual') amount = 109.90;
      else if (planType === 'annual') amount = 199.90;

      const renewalTx = {
        id: 'tx-' + uuidv4().substring(0, 8),
        storeId: storeId,
        storeName: store.settings.storeName || 'Loja ' + storeId,
        planType: planType,
        amount: amount,
        date: new Date().toISOString()
      };
      transactions.push(renewalTx);
      await saveTransactionToFirestore(renewalTx);
    }
  }
  if (password !== undefined && password.trim() !== '') {
    store.password = password;
  }
  if (storeName !== undefined && storeName.trim() !== '') {
    store.settings.storeName = storeName;
  }
  
  stores.set(storeId, store);
  await saveStoreToFirestore(storeId, store);
  res.json({ success: true });
});

// List billing transactions
app.get('/api/super/transactions', superAuth, async (req: any, res: any) => {
  await syncTransactionsFromFirestore();
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(sorted);
});

// Add a manual billing transaction
app.post('/api/super/transactions', superAuth, async (req: any, res: any) => {
  const { storeId, storeName, planType, amount, date } = req.body;
  if (!amount || !storeName) {
    return res.status(400).json({ error: 'Nome da loja e valor são obrigatórios.' });
  }
  const newTx = {
    id: 'tx-' + uuidv4().substring(0, 8),
    storeId: storeId || 'manual',
    storeName,
    planType: planType || 'custom',
    amount: Number(amount),
    date: date || new Date().toISOString()
  };
  transactions.push(newTx);
  await saveTransactionToFirestore(newTx);
  res.json({ success: true, transaction: newTx });
});

// Delete a billing transaction
app.delete('/api/super/transactions/:id', superAuth, async (req: any, res: any) => {
  const txId = req.params.id;
  transactions = transactions.filter(t => t.id !== txId);
  saveTransactionsLocal();
  await deleteTransactionFromFirestore(txId);
  res.json({ success: true });
});


// --- VITE MIDDLEWARE ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  let vite: any;
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // Intercept HTML requests to inject OG tags for store sharing
  app.get('*', async (req, res, next) => {
    if (req.method !== 'GET' || !req.headers.accept?.includes('text/html')) {
      return next();
    }

    const url = req.originalUrl;
    const match = url.match(/^\/(?:s\/|digimenu\/|cardapp\/)?([^\/\?]+)/);
    const slug = match ? match[1] : null;

    if (!slug || ['admin', 'api', 'pix-payment', 'assets'].includes(slug)) {
      return next();
    }

    const store = await syncStoreBySlugOrId(slug);
    if (!store) {
      return next();
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const imageUrl = `${protocol}://${host}/api/stores/${store.id}/logo`;
    const shareUrl = `${protocol}://${host}${req.originalUrl}`;

    const title = `${store.settings.storeName} | Cardápio Digital`;
    const desc = store.settings.description || `Acesse o cardápio digital do ${store.settings.storeName} e faça seu pedido de forma rápida e fácil!`;
    const ogTags = `
    <title>${title}</title>
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="350">
    <meta property="og:image:height" content="350">
    <meta property="og:site_name" content="${store.settings.storeName}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${imageUrl}">
    `;

    try {
      let html = '';
      if (!isProd) {
        html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        html = await vite.transformIndexHtml(url, html);
      } else {
        html = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      }

      // Replace generic title and clean up predefined meta tags to prevent social preview overrides
      html = html.replace(/<title>.*?<\/title>/gi, '');
      html = html.replace(/<meta\s+[^>]*property=["'](?:og|twitter):[^"']*["'][^>]*\/?>/gi, '');
      html = html.replace(/<meta\s+[^>]*name=["'](?:og|twitter|description):[^"']*["'][^>]*\/?>/gi, '');
      html = html.replace('</head>', `${ogTags}\n</head>`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e: any) {
      console.error('[OG Tag Middleware Error]', e);
      next(e);
    }
  });

  if (!isProd) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false })); // Let the dynamic handler process root requests if needed, but since static comes after, our handler caught it first.
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
