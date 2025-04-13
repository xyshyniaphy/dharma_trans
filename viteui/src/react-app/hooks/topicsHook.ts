import { useEffect, useMemo } from 'react';
import { useRecoilState } from 'recoil';
import { atom } from 'recoil';
import { Topic } from '../interface/topic_interface';
import { openDB } from '../utils/db_util';
import { useDTConfig } from './configHook';

const TOPIC_STORE = 'topics';

export const topicsState = atom<Topic[]>({
  key: 'topicsState',
  default: [],
});

// Function to get a single topic directly from IndexedDB - EXPORTED
export const getTopicByIdFromDB = (topicId: string): Promise<Topic | undefined> => {
  return openDB().then(db => {
    return new Promise<Topic | undefined>((resolve, reject) => {
      if (!topicId) {
        resolve(undefined); // Resolve with undefined if no ID is provided
        return;
      }
      const transaction = db.transaction(TOPIC_STORE, 'readonly');
      const store = transaction.objectStore(TOPIC_STORE);
      const request = store.get(topicId);

      request.onsuccess = () => {
        resolve(request.result as Topic | undefined); // result might be undefined if not found
      };
      request.onerror = () => {
        console.error(`Error fetching topic ${topicId} from DB:`, request.error);
        reject(request.error);
      };
    });
  });
};

// Function to get all topics directly from IndexedDB - EXPORTED
export const getAllTopicsFromDB = (): Promise<Topic[]> => {
  return openDB().then(db => {
    return new Promise<Topic[]>((resolve, reject) => {
      const transaction = db.transaction(TOPIC_STORE, 'readonly');
      const store = transaction.objectStore(TOPIC_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error("Error fetching all topics from DB:", request.error);
        reject(request.error);
      };
    });
  });
};

let topicsInited = false;
let initingTopic = false;

export function useTopics() {
  const [topics, setTopics] = useRecoilState(topicsState);

  const { config, updateConfig } = useDTConfig();

  // currentTopic derived from state is still useful for quick display purposes
  const currentTopic = useMemo(() => topics.find(topic => topic.topicId === config.topicId), [topics,config]);
  const currentTopicId = useMemo(() => config.topicId, [config]);



  const initTopics = async () => {
    if(topicsInited) return;
    if(initingTopic) return;
    initingTopic = true;

    try {
      const existingTopics = await getAllTopicsFromDB();
      if (existingTopics.length === 0) {
        console.log('No existing topics found, creating default topic.');
        // Create default topic and set it as current
        const defaultTopic = await createTopic('新话题'); // createTopic now returns the created topic
        if (defaultTopic) {
          updateConfig({ topicId: defaultTopic.topicId }); // Set the new topic as current
        }
      } else {
        setTopics(existingTopics);
        // Ensure a current topic is set if none exists
        if (!config.topicId && existingTopics.length > 0) {
           updateConfig({ topicId: existingTopics[0].topicId });
        }
      }
    } catch (error) {
       console.error("Error initializing topics:", error);
    }
    finally{
      //global cache, do not change this logic
      topicsInited = true;
    }
  };

  // Function to reload topics state from DB
  const loadTopics = async () => {
    try {
        const existingTopics = await getAllTopicsFromDB();
        setTopics(existingTopics);
        return existingTopics; // Return the loaded topics
    } catch (error) {
        console.error("Error loading topics from DB:", error);
        setTopics([]); // Reset state on error
        return []; // Return empty array on error
    }
  };

    const clearTopics = async (): Promise<void> => {
        try {
            const db = await openDB();
            const transaction = db.transaction(TOPIC_STORE, 'readwrite');
            const store = transaction.objectStore(TOPIC_STORE);

            await store.clear();
            await loadTopics(); // Reload state after clearing
            updateConfig({ topicId: "" }); // Reset current topic ID
        } catch (error) {
            console.error("Error clearing topics:", error);
        }
    };


  //do not add dependency to useEffect
  useEffect(() => {
    if(!topicsInited)return;
    if(topics.length === 0)return;
    // Set initial current topic only if topics are loaded and no currentTopicId is set
    if(!config.topicId) {
        //console.log('Setting first topic as current:', topics[0]);
        updateConfig({ topicId: topics[0].topicId });
    }
    // If currentTopicId exists but the topic is no longer in the list (e.g., deleted), reset it
    else if (config.topicId && !topics.some(t => t.topicId === config.topicId)) {
        updateConfig({ topicId: topics[0].topicId }); // Set to first available topic
    } 
    // Removed updateConfig from dependency array to prevent infinite loop
  }, [topics]);

  const createTopic = async (name: string): Promise<Topic | undefined> => {
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
      await loadTopics(); // Reload state after adding
      return topic; // Return the created topic
    } catch (error) {
      console.error("Error creating topic:", error);
      return undefined;
    }
  };


  const deleteTopic = async (topicId: string): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);

      await store.delete(topicId);
      const remainingTopics = await loadTopics(); // Reload state after deleting

      // If the deleted topic was the current one, set current to null or the first remaining topic
      if(config.topicId === topicId) {
          updateConfig({ topicId: remainingTopics.length > 0 ? remainingTopics[0].topicId : "" });
      }
    } catch (error) {
      console.error(`Error deleting topic ${topicId}:`, error);
    }
  };

  const updateTopic = async (topicId: string, updatedFields: Partial<Topic>): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(TOPIC_STORE, 'readwrite');
      const store = transaction.objectStore(TOPIC_STORE);

      // Fetch the existing topic directly within the transaction
      const existingTopic = await new Promise<Topic | undefined>((resolve, reject) => {
        const getRequest = store.get(topicId);
        getRequest.onsuccess = () => resolve(getRequest.result as Topic | undefined);
        getRequest.onerror = () => reject(getRequest.error);
      });

      if (existingTopic) {
        const updatedTopic = { ...existingTopic, ...updatedFields };
        await store.put(updatedTopic);
        await loadTopics(); // Reload state after updating
      } else {
          console.warn(`updateTopic: Topic with ID ${topicId} not found in DB.`);
      }
    } catch (error) {
      console.error(`Error updating topic ${topicId}:`, error);
    }
  };


  return {
    topicsInited,
    topics, // The state
    createTopic,
    deleteTopic,
    updateTopic,
    clearTopics,
    currentTopic, // Derived from state
    currentTopicId,
    initTopics,
    // Expose DB access functions if needed by other hooks/components directly
    // getTopicByIdFromDB, // No need to export from the hook itself, it's exported above
    // getAllTopicsFromDB, // No need to export from the hook itself, it's exported above
    loadTopics // Export reload function
  };
}
