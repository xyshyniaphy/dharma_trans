import { useTopics } from './topicsHook';
import { useTransHistory } from './transHistoryHook';
import { Translation } from '../interface/translation_interface';
import { useEffect } from 'react';

export function useTopicsManager() {
  const { 
    topics, 
    updateTopic,
    deleteTopic,
    currentTopic,
    currentTopicId,
    createTopic
  } = useTopics();

  const { insertTransHistory, deleteTransHistory, getTranslations } = useTransHistory();

  //reload when current topic changed, or on crud
  const reloadTranslations = async () => {
    if(!currentTopicId || !currentTopic) return;
    (async () => {
      try {
        await getTranslations(currentTopic.translationIds);
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    })();
  };

  //reload translations when current topic changed
  useEffect(() => {
    if(currentTopic) console.log('current topic is :', currentTopic.name + ' ' + currentTopic.topicId);
    reloadTranslations();
  }, [currentTopicId]);

  // Add translation to a topic
  const addTranslationToTopic = async (translation: Translation): Promise<void> => {
    if(!currentTopicId || !currentTopic) return;
   
    await insertTransHistory(translation);
    const newIds=[...(currentTopic?.translationIds || []), translation.translateId];
    const baseTopicName = currentTopic.name === '新话题' ? translation.input : currentTopic.name;
    const topicName = baseTopicName.length > 10 ? `${baseTopicName.slice(0, 10)}...` : baseTopicName;
    await updateTopic(currentTopicId, {
      translationIds: newIds,
      name: topicName
    });
    await getTranslations(newIds);
  };

  // Delete translation from topic and history
  const deleteTranslation = async (translationId: string): Promise<void> => {
    if (!currentTopicId || !currentTopic) return;
    
    await deleteTransHistory(translationId);
    const newIds=currentTopic.translationIds.filter(id => id !== translationId);
    await updateTopic(currentTopicId, {
      translationIds: newIds
    });
    await getTranslations(newIds);
  };

  const deleteTopicAndTranslations = async (topicId: string) => {
    try {
      // Find the topic by ID from the topics array
      const topic = topics.find(t => t.topicId === topicId);
      if (!topic) return;
      
      // Delete all associated translations
      if (topic.translationIds) {
        for (const transId of topic.translationIds) {
          await deleteTransHistory(transId);
        }
      }
      
      // Finally delete the topic itself
      await deleteTopic(topicId);
    } catch (error) {
      console.error('Error deleting topic and translations:', error);
    }
  };

  return {
    topics,
    currentTopicId,
    deleteTopic:deleteTopicAndTranslations,
    addTranslationToTopic,
    deleteTranslation,
    createTopic
  };
}
