import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Translation } from '../interface/translation_interface';
import { openDB } from '../utils/db_util';

const TRANSLATION_STORE = 'translations';

// Fetches multiple translations by ID
const __getTranslations = async (translationIds: string[]): Promise<Translation[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRANSLATION_STORE, 'readonly');
    const store = transaction.objectStore(TRANSLATION_STORE);

    const results: Translation[] = [];
    let count = 0;

    // Handle empty list gracefully
    if (translationIds.length === 0) {
        resolve(results);
        return;
    }

    translationIds.forEach(id => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) {
          // Ensure isThinkingExpanded has a default value when fetching
          results.push({ ...request.result, isThinkingExpanded: request.result.isThinkingExpanded ?? false });
        }
        count++;
        if (count === translationIds.length) {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });

    // Handle potential transaction errors
    transaction.onerror = () => reject(transaction.error);
  });
};

// Inserts or updates a translation in IndexedDB
const upsertTranslation = async (translation: Translation): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRANSLATION_STORE, 'readwrite');
    const store = transaction.objectStore(TRANSLATION_STORE);

    // Use put which handles both insert and update
    const request = store.put({ ...translation, id: translation.translateId }); // Ensure 'id' field matches keyPath if needed by DB setup

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error); // Also handle transaction errors
  });
};

// Deletes a translation from IndexedDB
const deleteTranslation = async (translateId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRANSLATION_STORE, 'readwrite');
    const store = transaction.objectStore(TRANSLATION_STORE);

    const request = store.delete(translateId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error); // Also handle transaction errors
  });
};

// Recoil atom for the translation history state
const transHistoryAtom = atom<Array<Translation>>({
  key: 'transHistoryState',
  default: []
});

// Custom hook for managing translation history
export const useTransHistory = () => {
  const [transHistory, setTransHistory] = useRecoilState(transHistoryAtom);

  // Fetches translations and updates Recoil state
  const getTranslations = async (translationIds: string[]) => {
    try {
      if(!translationIds || translationIds.length === 0) {
        setTransHistory([]);
        return;
      }
      const translations = await __getTranslations(translationIds);
      translations.forEach(t => {
        t.thinking = t.thinking.replace(/\n/g, '\n').replace(/\\n/g, '\n');
      });
      // Sort by timestamp descending
      setTransHistory(translations.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error getting translations:', error);
      // Rethrow or handle error state if needed
      // throw error;
    }
  };

  // Inserts a new translation into Recoil state and IndexedDB
  const insertTransHistory = async (translation: Translation) => {
    try {
      // Ensure default expansion state is set before inserting
      const translationToInsert = { ...translation, isThinkingExpanded: translation.isThinkingExpanded ?? false };
      await upsertTranslation(translationToInsert);
      // Add to Recoil state and re-sort
      setTransHistory(prev => [...prev, translationToInsert].sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error inserting translation:', error);
      // Rethrow or handle error state if needed
      // throw error;
    }
  };

  // Deletes a translation from Recoil state and IndexedDB
  const deleteTransHistory = async (translateId: string) => {
    try {
      await deleteTranslation(translateId);
      // Remove from Recoil state
      setTransHistory(prev => prev.filter(t => t.translateId !== translateId));
    } catch (error) {
      console.error('Error deleting translation:', error);
      // Rethrow or handle error state if needed
      // throw error;
    }
  };

  // Updates the expansion state of a specific translation
  const updateTranslationExpansionState = async (translateId: string, isExpanded: boolean) => {
    try {
      // Find the translation in the current Recoil state
      const currentTranslation = transHistory.find(t => t.translateId === translateId);
      if (!currentTranslation) {
          console.warn(`Translation with ID ${translateId} not found in Recoil state.`);
          return; // Or fetch from DB if necessary, though it should be in sync
      }

      // Create the updated translation object
      const updatedTranslation = { ...currentTranslation, isThinkingExpanded: isExpanded };

      // Update IndexedDB first
      await upsertTranslation(updatedTranslation);

      // Update Recoil state
      setTransHistory(prev =>
        prev.map(t =>
          t.translateId === translateId ? updatedTranslation : t
        )
      );
    } catch (error) {
      console.error(`Error updating expansion state for ${translateId}:`, error);
      // Rethrow or handle error state if needed
      // throw error;
    }
  };


  return {
    transHistory,
    getTranslations,
    insertTransHistory,
    deleteTransHistory,
    updateTranslationExpansionState // Expose the new function
  };
};
