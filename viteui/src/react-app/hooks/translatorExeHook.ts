import { useDTConfig } from './configHook';
import { useTranslatorStatus } from './useTranslatorStatus';
import m_processText from '../utils/translate_tool';
import { useCurrentTranslate } from './currentTranslateHook';
import { Translation } from '../interface/translation_interface';
import { OpenRouterModel } from '../hooks/filterModels';

type CurrentTranslateItemProps = {
  addTranslationToTopic?: (translation: Translation) => Promise<void>;
};


export const useTranslatorExe = (props: CurrentTranslateItemProps) => {
  const { addTranslationToTopic } = props;
  const { config } = useDTConfig();
  const { explain, apiKey } = config; // Removed selectedModel from here
  const [{  }, updateStatus] = useTranslatorStatus();
  const [_trans, setTranslate] = useCurrentTranslate();

  // Added currentModelId parameter
  const startTranslate = async (trans: Translation, currentModel: OpenRouterModel) => {
    // Check the passed ID
    if(!trans || !currentModel) return;

    const newTrans = await m_processText(
      explain,
      apiKey,
      trans,
      updateStatus,
      setTranslate,
      currentModel
    );

    if(!newTrans) return;
    
    console.log('new translation:', newTrans);
    addTranslationToTopic && addTranslationToTopic(newTrans);
  };

  return {startTranslate};
};
