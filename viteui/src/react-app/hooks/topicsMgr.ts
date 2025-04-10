import { useTopics } from './topicsHook';
import { useTransHistory } from './transHistoryHook';
import { Translation } from '../interface/translation_interface';
import { useCurrentTopic } from './currentTopicHook';
import { useCurrentTranslate } from './currentTranslateHook';
import { useEffect } from 'react';

export function useTopicsManager() {
  const { 
    topics, 
    createTopic, 
    deleteTopic, 
    updateTopic, 
    clearTopics 
  } = useTopics();
  const { currentTopic, setCurrentTopic } = useCurrentTopic();

  const { transHistory, insertTransHistory, deleteTransHistory, getTranslations } = useTransHistory();

  useEffect(() => {
    if(!currentTopic || currentTopic.translationIds.length === 0) return;
    (async () => {
      try {
        await getTranslations(currentTopic.translationIds);
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    })();
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

  // Get all translations for a specific topic
  const getTranslationsForTopic = (topicId: string): Translation[] => {
    const topic = topics.find(t => t.topicId === topicId);
    if (!topic) return [];
    
    return transHistory.filter(t => topic.translationIds.includes(t.translateId));
  };

  return {
    topics,
    currentTopic,
    setCurrentTopic,
    createTopic,
    deleteTopic,
    updateTopic,
    clearTopics,
    addTranslationToTopic,
    removeTranslationFromTopic,
    deleteTranslation,
    getTranslationsForTopic
  };
}
