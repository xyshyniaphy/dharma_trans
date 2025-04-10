import { useEffect, useMemo } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Topic } from '../interface/topic_interface';
import { openDB } from '../utils/db_util';
import { useCurrentTopicId } from './currentTopicHook';

const TOPIC_STORE = 'topics';

export const topicsState = atom<Topic[]>({
  key: 'topicsState',
  default: [],
});

export function useTopics() {
  const [topics, setTopics] = useRecoilState(topicsState);

  const { currentTopicId, setCurrentTopicId} = useCurrentTopicId();

  const currentTopic = useMemo(() => topics.find(topic => topic.topicId === currentTopicId), [topics, currentTopicId]);

  const loadTopics = async () => {
    const existingTopics = await getAllTopicsFromDB();
    if (existingTopics.length === 0) {
      console.log('No existing topics found, creating default topic.');
      createTopic('新翻译');
    } else {
      setTopics(existingTopics);
    }
  };

  useEffect(() => {
    if(!topics || topics.length === 0) loadTopics();
  }, []);

  useEffect(() => {
    if(!topics || topics.length === 0) return;
    if(currentTopicId) return;
    console.log('Setting first topic as current:', topics[0]);
    setCurrentTopicId(topics[0].topicId);
  }, [currentTopicId,topics]);

  const createTopic = (name: string): void => {
    openDB().then(db => {
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      
      const topic: Topic = {
        topicId: Date.now().toString() + "_" + (Math.random()*1000).toFixed(0),
        name,
        translationIds: []
      };
      
      const request = store.add(topic);
      
      request.onsuccess = () => {
        loadTopics();
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
        loadTopics();
      };
      request.onerror = () => console.error(request.error);
    });
  };

  const updateTopic = (topicId: string, updatedFields: Partial<Topic>): void => {
    openDB().then(db => {
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      
      const getRequest = store.get(topicId);
      
      getRequest.onsuccess = () => {
        const existingTopic = getRequest.result;
        if (existingTopic) {
          const updatedTopic = { ...existingTopic, ...updatedFields };
          const updateRequest = store.put(updatedTopic);
          
          updateRequest.onsuccess = () => {
            loadTopics();
          };
          updateRequest.onerror = () => console.error(updateRequest.error);
        }
      };
      getRequest.onerror = () => console.error(getRequest.error);
    });
  };

  const clearTopics = (): void => {
    openDB().then(db => {
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      const request = store.clear();
      
      request.onsuccess = () => {
        loadTopics();
      };
      request.onerror = () => console.error(request.error);
    });
  };

  return {
    topics,
    createTopic,
    deleteTopic,
    updateTopic,
    clearTopics,
    currentTopic
  };
}
