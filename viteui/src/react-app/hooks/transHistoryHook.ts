import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Translation } from '../interface/translation_interface';
import { openDB } from '../utils/db_util';

const TRANSLATION_STORE = 'translations';

const getTranslations = async (): Promise<Translation[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRANSLATION_STORE, 'readonly');
    const store = transaction.objectStore(TRANSLATION_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const insertTranslation = async (translation: Translation): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRANSLATION_STORE, 'readwrite');
    const store = transaction.objectStore(TRANSLATION_STORE);
    
    store.put({ ...translation, id: translation.translateId });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const deleteTranslation = async (translateId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRANSLATION_STORE, 'readwrite');
    const store = transaction.objectStore(TRANSLATION_STORE);
    
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

  return [transHistory, insertTransHistory, deleteTransHistory] as const;
};
