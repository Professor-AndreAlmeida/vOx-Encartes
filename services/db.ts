import { LeafletState, UserSettings } from "../types";

const DB_NAME = 'vox-encartes-db';
const DB_VERSION = 1;
const STORE_SETTINGS = 'settings';
const STORE_STATE = 'app-state';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject("Erro ao abrir banco de dados");

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE, { keyPath: 'id' });
      }
    };
  });
};

export const saveSettings = async (settings: UserSettings): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.put({ id: 'user-config', ...settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Erro ao salvar configurações");
  });
};

export const getSettings = async (): Promise<UserSettings | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.get('user-config');

    request.onsuccess = () => resolve(request.result ? request.result : null);
    request.onerror = () => reject("Erro ao carregar configurações");
  });
};

export const saveAppState = async (state: LeafletState): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_STATE], 'readwrite');
    const store = transaction.objectStore(STORE_STATE);
    const request = store.put({ id: 'current-session', ...state });

    request.onsuccess = () => resolve();
    request.onerror = () => reject("Erro ao salvar estado da aplicação");
  });
};

export const getAppState = async (): Promise<LeafletState | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_STATE], 'readonly');
    const store = transaction.objectStore(STORE_STATE);
    const request = store.get('current-session');

    request.onsuccess = () => {
        if (request.result) {
            // Remove the ID property injected during save
            const { id, ...state } = request.result;
            resolve(state as LeafletState);
        } else {
            resolve(null);
        }
    };
    request.onerror = () => reject("Erro ao carregar estado da aplicação");
  });
};

export const clearAllData = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SETTINGS, STORE_STATE], 'readwrite');
        transaction.objectStore(STORE_SETTINGS).clear();
        transaction.objectStore(STORE_STATE).clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject();
    });
};
