import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Topic } from '../interface/topic_interface';
import { openDB } from '../utils/db_util';

const TOPIC_STORE = 'topics';

export const topicsState = atom<Topic[]>({
  key: 'topicsState',
  default: [],
});

export function useTopics() {
  const [topics, setTopics] = useRecoilState(topicsState);

  useEffect(() => {
    const initializeTopics = async () => {
      const existingTopics = await getAllTopicsFromDB();
      if (existingTopics.length === 0) {
        console.log('No existing topics found, creating default topic.');
        createTopic('新翻译');
      } else {
        setTopics(existingTopics);
      }
    };
    initializeTopics();
  }, []);

  const createTopic = (name: string): void => {
    openDB().then(db => {
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      
      const topic: Topic = {
        topicId: Date.now().toString() + "_" + (Math.random()*1000).toFixed(4),
        name,
        translationIds: []
      };
      
      const request = store.add(topic);
      
      request.onsuccess = () => {
        getAllTopicsFromDB().then(topics => setTopics(topics));
      };
      request.onerror = () => console.error(request.error);
    });
  };

  const getAllTopicsFromDB = (): Promise<Topic[]> => {
    return openDB().then(db => {
      return new Promise<Topic[]>((resolve, reject) => {
        const transaction = db.transaction(TOPIC_STORE, 'readonly');
        const store = transaction.objectStore(TOPIC_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  };

  const deleteTopic = (topicId: string): void => {
    openDB().then(db => {
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      const request = store.delete(topicId);
      
      request.onsuccess = () => {
        getAllTopicsFromDB().then(topics => setTopics(topics));
      };
      request.onerror = () => console.error(request.error);
    });
  };
  
  return {
    topics,
    setTopics,
    createTopic,
    deleteTopic,
  };
}
