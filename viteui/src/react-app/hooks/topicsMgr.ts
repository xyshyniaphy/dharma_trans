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
    await updateTopic(currentTopicId, {
      translationIds: newIds
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

  return {
    topics,
    addTranslationToTopic,
    deleteTranslation
  };
}
