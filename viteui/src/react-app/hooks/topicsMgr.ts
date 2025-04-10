import { useTopics } from './topicsHook';
import { useTransHistory } from './transHistoryHook';
import { Translation } from '../interface/translation_interface';
import { useEffect } from 'react';

export function useTopicsManager() {
  const { 
    topics, 
    updateTopic,
    currentTopic,
    currentTopicId
  } = useTopics();

  const { insertTransHistory, deleteTransHistory, getTranslations } = useTransHistory();

  //reload when current topic changed, or on crud
  const reloadTranslations = async () => {
    if(!currentTopic) return;
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
    // if(currentTopic) console.log('current topic is :', currentTopic.name + ' ' + currentTopic.topicId);
    reloadTranslations();
  }, [currentTopicId]);

  // Add translation to a topic
  const addTranslationToTopic = async (translation: Translation): Promise<void> => {
    if(!currentTopic) return;
   
    await insertTransHistory(translation);
    await updateTopic(currentTopic.topicId, {
      translationIds: [...(topics.find(t => t.topicId === currentTopic.topicId)?.translationIds || []), translation.translateId]
    });
    
    await reloadTranslations();
  };

  // Delete translation from topic and history
  const deleteTranslation = async (translationId: string): Promise<void> => {
    if (!currentTopic) return;
    
    await deleteTransHistory(translationId);
    await updateTopic(currentTopic.topicId, {
      translationIds: topics
        .find(t => t.topicId === currentTopic.topicId)
        ?.translationIds
        .filter(id => id !== translationId) || []
    });
    await reloadTranslations();
  };

  return {
    topics,
    addTranslationToTopic,
    deleteTranslation
  };
}
