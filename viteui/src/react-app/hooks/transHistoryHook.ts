import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Translation } from '../interface/translation_interface';
import { openDB } from '../utils/db_util';

const TRANSLATION_STORE = 'translations';

const __getTranslations = async (translationIds: string[]): Promise<Translation[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRANSLATION_STORE, 'readonly');
    const store = transaction.objectStore(TRANSLATION_STORE);
    
    const results: Translation[] = [];
    let count = 0;
    
    translationIds.forEach(id => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) {
          results.push(request.result);
        }
        count++;
        if (count === translationIds.length) {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
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

  const getTranslations = async (translationIds: string[]) => {
    try {
      const translations = await __getTranslations(translationIds);
      setTransHistory(translations);
    } catch (error) {
      console.error('Error getting translations:', error);
    }
  };

  const insertTransHistory = async (translation: Translation) => {
    try {
      await insertTranslation(translation);
    } catch (error) {
      console.error('Error inserting translation:', error);
    }
  };

  const deleteTransHistory = async (translateId: string) => {
    try {
      await deleteTranslation(translateId);
    } catch (error) {
      console.error('Error deleting translation:', error);
    }
  };

  return {
    transHistory,
    getTranslations,
    insertTransHistory,
    deleteTransHistory
  };
};
