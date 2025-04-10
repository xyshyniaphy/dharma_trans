import { useTopics } from './topicsHook';
import { useTransHistory } from './transHistoryHook';
import { Translation } from '../interface/translation_interface';
import { useEffect } from 'react';

export function useTopicsManager() {
  const { 
    topics, 
    updateTopic,
    currentTopic
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
    if(currentTopic) console.log('current topic is :', currentTopic.name + ' ' + currentTopic.topicId);
    reloadTranslations();
  }, [currentTopic]);

  // Add translation to a topic
  const addTranslationToTopic = ( translation: Translation): void => {
    if(!currentTopic) return;
    updateTopic(currentTopic.topicId, {
      translationIds: [...(topics.find(t => t.topicId === currentTopic.topicId)?.translationIds || []), translation.translateId]
    });
    insertTransHistory(translation);
  };

  // Remove translation from a topic
  const removeTranslationFromTopic = (translateId: string): void => {
    if(!currentTopic) return;
    updateTopic(currentTopic.topicId, {
      translationIds: topics.find(t => t.topicId === currentTopic.topicId)?.translationIds.filter(id => id !== translateId) || []
    });
    deleteTransHistory(translateId);
  };

  // Delete translation from topic and history
  const deleteTranslation = (translationId: string): void => {
    if (!currentTopic) return;
    
    updateTopic(currentTopic.topicId, {
      translationIds: topics
        .find(t => t.topicId === currentTopic.topicId)
        ?.translationIds
        .filter(id => id !== translationId) || []
    });
    
    deleteTransHistory(translationId);
  };

  return {
    topics,
    addTranslationToTopic,
    removeTranslationFromTopic,
    deleteTranslation
  };
}
