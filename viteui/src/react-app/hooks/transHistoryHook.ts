import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Translation } from '../interface/translation_interface';

const DB_NAME = 'TranslationsDB';
const STORE_NAME = 'translations';

const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getTranslations = async (): Promise<Translation[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveTranslations = async (translations: Translation[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear existing data
    store.clear();
    
    // Add all translations using translateId as key
    (async () => {
      for (const translation of translations) {
        await insertTranslation(translation);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    })();
  });
};

const insertTranslation = async (translation: Translation): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Use existing translateId as key
    store.put({ ...translation, id: translation.translateId });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const deleteTranslation = async (translateId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.delete(translateId);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const transHistoryAtom = atom<Array<Translation>>({
  key: 'transHistoryState',
  default: []
});

export const useTransHistory = () => {
  const [transHistory, setTransHistory] = useRecoilState(transHistoryAtom);
  const [isDBReady, setIsDBReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedHistory = await getTranslations();
        if (storedHistory.length > 0) {
          setTransHistory(storedHistory);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
      } finally {
        setIsDBReady(true);
      }
    })();
  }, []);

  const updateTransHistory = async (newHistory: Array<Translation>) => {
    setTransHistory(newHistory);
    if (isDBReady) {
      try {
        await saveTranslations(newHistory);
      } catch (error) {
        console.error('Error saving translations:', error);
      }
    }
  };

  const insertTransHistory = async (translation: Translation) => {
    const newHistory = [...transHistory, translation];
    setTransHistory(newHistory);
    if (isDBReady) {
      try {
        await insertTranslation(translation);
      } catch (error) {
        console.error('Error inserting translation:', error);
      }
    }
    return newHistory;
  };

  const deleteTransHistory = async (translateId: string) => {
    const newHistory = transHistory.filter(t => t.translateId !== translateId);
    setTransHistory(newHistory);
    if (isDBReady) {
      try {
        await deleteTranslation(translateId);
      } catch (error) {
        console.error('Error deleting translation:', error);
      }
    }
    return newHistory;
  };

  return [transHistory, updateTransHistory, insertTransHistory, deleteTransHistory] as const;
};
