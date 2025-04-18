import { useDTConfig } from './configHook';
import { useTranslatorStatus } from './useTranslatorStatus';
import m_processText from '../utils/translate_tool';
import { useCurrentTranslate } from './currentTranslateHook';
import { Translation } from '../interface/translation_interface';
import { OpenRouterModel } from '../hooks/filterModels';
import { getFewShotExamples } from '../utils/getFewShot';
import { TransData } from '../interface/trans_data';

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
  const startTranslate = async (trans: Translation, currentModel: OpenRouterModel, transData: TransData) => {
    // Check the passed ID
    if(!trans || !currentModel) return;

    // Fetch transData and fewShotExamples here
    // const transData = await fetchTransData(); // Removed, now passed as parameter

    const alphabetRegex = /[a-zA-Z]/g;
    const alphabetMatch = trans.input.match(alphabetRegex);
    const alphabetPercentage = alphabetMatch ? (alphabetMatch.length / trans.input.length) * 100 : 0;
    let isAlphabet = alphabetPercentage > 50;
    let translatePrompt = "Translate following text into ";
  
    if(isAlphabet){
      translatePrompt = translatePrompt + "Chinese ";
    }else{
      translatePrompt = translatePrompt + "English ";
    }
    
    const fewShotExamples = await getFewShotExamples(trans.input, transData.one_shot, translatePrompt);

    const newTrans = await m_processText(
      explain,
      apiKey,
      trans,
      updateStatus,
      setTranslate,
      currentModel,
      fewShotExamples,
      translatePrompt
    );

    if(!newTrans) return;
    
    console.log('new translation:', newTrans);
    addTranslationToTopic && addTranslationToTopic(newTrans);
  };

  return {startTranslate};
};
