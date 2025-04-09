import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Topic } from '../interface/topic_interface';
import { openDB } from '../utils/db_util';

const TOPIC_STORE = 'topics';

export const topicsState = atom<Topic[]>({
  key: 'topicsState',
  default: [],
});

export const createTopic = async (name: string): Promise<Topic> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TOPIC_STORE, 'readwrite');
    const store = transaction.objectStore(TOPIC_STORE);
    
    const topic: Topic = {
      topicId: Date.now().toString() + "_" + (Math.random()*1000).toFixed(4),
      name,
      translationIds: []
    };
    
    const request = store.add(topic);
    
    request.onsuccess = () => resolve(topic);
    request.onerror = () => reject(request.error);
  });
};

export const getTopics = async (): Promise<Topic[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TOPIC_STORE, 'readonly');
    const store = transaction.objectStore(TOPIC_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteTopic = async (topicId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TOPIC_STORE, 'readwrite');
    const store = transaction.objectStore(TOPIC_STORE);
    const request = store.delete(topicId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export function useTopics() {
  const [topics, setTopics] = useRecoilState(topicsState);
  
  return {
    topics,
    setTopics,
  };
}
