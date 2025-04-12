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


  const initTopics = async () => {
    const existingTopics = await getAllTopicsFromDB();
    if (existingTopics.length === 0) {
      console.log('No existing topics found, creating default topic.');
      createTopic('新话题');
    } else {
      setTopics(existingTopics);
    }
  };

  const loadTopics = async () => {
    const existingTopics = await getAllTopicsFromDB();
    setTopics(existingTopics);
    
  };



  useEffect(() => {
    if(!topics || topics.length === 0) return;
    if(currentTopicId) return;
    //console.log('Setting first topic as current:', topics[0]);
    setCurrentTopicId(topics[0].topicId);
  }, [currentTopicId,topics]);

  const createTopic = async (name: string): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      
      const topic: Topic = {
        topicId: Date.now().toString() + "_" + (Math.random()*1000).toFixed(0),
        name,
        translationIds: []
      };
      
      await store.add(topic);
      await loadTopics();
    } catch (error) {
      console.error(error);
    }
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

  const deleteTopic = async (topicId: string): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      
      await store.delete(topicId);
      await loadTopics();
      if(currentTopicId === topicId) setCurrentTopicId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const updateTopic = async (topicId: string, updatedFields: Partial<Topic>): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      
      const existingTopic = await new Promise<Topic>((resolve, reject) => {
        const getRequest = store.get(topicId);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      });
      
      if (existingTopic) {
        const updatedTopic = { ...existingTopic, ...updatedFields };
        await store.put(updatedTopic);
        await loadTopics();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const clearTopics = async (): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);
      
      await store.clear();
      await loadTopics();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    topics,
    createTopic,
    deleteTopic,
    updateTopic,
    clearTopics,
    currentTopic,
    currentTopicId,
    initTopics
  };
}
