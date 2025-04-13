import { useTopics, getTopicByIdFromDB } from './topicsHook'; // Import the new DB fetch function
import { useTransHistory } from './transHistoryHook';
import { Translation } from '../interface/translation_interface';
import { useEffect } from 'react';

export function useTopicsManager() {
  const {
    topics, // Keep state for UI rendering if needed, but rely on DB fetch for critical ops
    updateTopic,
    deleteTopic: deleteTopicFromHook, // Rename to avoid conflict with the manager's delete function
    // currentTopic, // Avoid using potentially stale state for modifications
    currentTopicId,
    createTopic,
    initTopics
  } = useTopics();

  const { insertTransHistory, deleteTransHistory, getTranslations } = useTransHistory();

  // Reload translations based on the current topic ID, fetching latest data from DB
  const reloadTranslations = async () => {
    if(!currentTopicId) return; // Only need ID

    try {
      // Fetch latest topic data directly from DB to ensure translationIds are up-to-date
      const latestTopicFromDB = await getTopicByIdFromDB(currentTopicId);
      if (!latestTopicFromDB) {
          // console.warn(`reloadTranslations: Topic with ID ${currentTopicId} not found in DB.`);
          await getTranslations([]); // Clear translations if topic doesn't exist
          return;
      }
      // Use latestTopicFromDB.translationIds
      await getTranslations(latestTopicFromDB.translationIds || []); // Ensure it's always an array
    } catch (error) {
      console.error('Error loading translations after fetching topic from DB:', error);
      await getTranslations([]); // Attempt to clear translations on error
    }
  };

  // Reload translations when current topic ID changes.
  // Keeping 'topics' dependency might still be relevant if other UI parts react to the state change,
  // but the core logic now relies on fetching fresh data via getTopicByIdFromDB triggered by currentTopicId change.
  useEffect(() => {
    reloadTranslations();
  }, [currentTopicId, topics]); // Consider if 'topics' dependency is truly needed here now

  // Add translation to a topic
  const addTranslationToTopic = async (translation: Translation): Promise<void> => {
    if(!currentTopicId) {
        console.error("addTranslationToTopic: No current topic ID selected.");
        return;
    }

    try {
      // Fetch the latest topic data directly from the DB before updating
      const topicFromDB = await getTopicByIdFromDB(currentTopicId);
      // If topic is not found in DB (e.g., deleted concurrently), exit
      if (!topicFromDB) {
          console.error(`addTranslationToTopic: Topic with ID ${currentTopicId} not found in DB.`);
          return;
      }

      // Insert the translation history record first
      await insertTransHistory(translation);

      // Use the translationIds from the fetched DB topic data, ensuring it's an array
      const currentTranslationIds = topicFromDB.translationIds || [];
      // Create the new array of IDs
      const newIds=[...currentTranslationIds, translation.translateId];

      // Determine topic name based on fetched DB data, fallback to new translation input if name is default
      const baseTopicName = topicFromDB.name === '新话题' ? translation.input : topicFromDB.name;
      // Truncate name if necessary
      const topicName = baseTopicName.length > 10 ? `${baseTopicName.slice(0, 10)}...` : baseTopicName;

      // Update the topic in the database/state with new IDs and potentially new name
      await updateTopic(currentTopicId, {
        translationIds: newIds,
        name: topicName
      });
      // Note: updateTopic internally calls loadTopics which updates the 'topics' state.

      // Fetch and update the displayed translations using the newly updated IDs
      await getTranslations(newIds); // Update translation history state

    } catch (error) {
        console.error(`Error adding translation to topic ${currentTopicId}:`, error);
    }
  };

  // Delete translation from topic and history
  const deleteTranslation = async (translationId: string): Promise<void> => {
    if (!currentTopicId) {
        console.error("deleteTranslation: No current topic ID selected.");
        return;
    }
     if (!translationId) {
        console.error("deleteTranslation: No translation ID provided.");
        return;
    }

    try {
      // Fetch the latest topic data directly from the DB before updating
      const topicFromDB = await getTopicByIdFromDB(currentTopicId);
      // If topic is not found in DB, exit
      if (!topicFromDB) {
          console.error(`deleteTranslation: Topic with ID ${currentTopicId} not found in DB.`);
          return;
      }

      // Delete the translation history record first
      await deleteTransHistory(translationId);

      // Use the translationIds from the fetched DB topic data, ensuring it's an array
      const currentTranslationIds = topicFromDB.translationIds || [];
      // Filter out the deleted ID - Add explicit type for 'id'
      const newIds=currentTranslationIds.filter((id: string) => id !== translationId);

      // Update the topic in the database/state with the modified list of IDs
      await updateTopic(currentTopicId, {
        translationIds: newIds
        // Name is not changed when deleting a translation
      });
      // Note: updateTopic internally calls loadTopics which updates the 'topics' state.

      // Fetch and update the displayed translations using the newly updated IDs
      await getTranslations(newIds); // Update translation history state

    } catch (error) {
        console.error(`Error deleting translation ${translationId} from topic ${currentTopicId}:`, error);
    }
  };

  // Function to delete a topic and all its associated translations
  const deleteTopicAndTranslations = async (topicId: string) => {
    if (!topicId) {
        console.error("deleteTopicAndTranslations: No topic ID provided.");
        return;
    }
    try {
      // Fetch the topic directly from DB to ensure we have the correct list of translation IDs
      const topicFromDB = await getTopicByIdFromDB(topicId);
      // If topic not found in DB, maybe it was already deleted. Log and exit.
      if (!topicFromDB) {
          console.warn(`deleteTopicAndTranslations: Topic with ID ${topicId} not found in DB.`);
          // Optionally, still try to delete the topic via the hook in case the state is lagging
          await deleteTopicFromHook(topicId);
          return;
      }

      // Delete all associated translations from history based on DB data
      if (topicFromDB.translationIds && topicFromDB.translationIds.length > 0) {
        // Add explicit type for 'transId'
        await Promise.all(topicFromDB.translationIds.map((transId: string) => deleteTransHistory(transId)));
      }

      // Finally delete the topic itself using the hook function from useTopics
      await deleteTopicFromHook(topicId); // This handles DB deletion and state update

    } catch (error) {
      console.error(`Error deleting topic ${topicId} and translations:`, error);
    }
  };


  return {
    topics, // Export state for UI
    currentTopicId,
    // Export the manager's composite delete function
    deleteTopic: deleteTopicAndTranslations,
    addTranslationToTopic,
    deleteTranslation,
    createTopic, // Expose original hook functions
    updateTopic,
    initTopics
  };
}
