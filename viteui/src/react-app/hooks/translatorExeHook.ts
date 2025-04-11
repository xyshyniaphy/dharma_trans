import { useEffect, useState } from 'react';
import { useDTConfig } from './configHook';
import { useCurrentModel } from './currentModelHook';
import { useTranslatorStatus } from './useTranslatorStatus';
import m_processText from '../utils/translate_tool';
import { useCurrentTranslate } from './currentTranslateHook';
import { Translation } from '../interface/translation_interface';

type CurrentTranslateItemProps = {
  addTranslationToTopic?: (translation: Translation) => Promise<void>;
};


export const useTranslatorExe = (props: CurrentTranslateItemProps) => {
  const { addTranslationToTopic } = props;
  const { config } = useDTConfig();
  const { explain, apiKey, selectedModel } = config;
  const [currentModel] = useCurrentModel();
  const [{  }, updateStatus] = useTranslatorStatus();
  
  const [outputText, setOutputText] = useState<string>('');
  const [thinkingText, setThinkingText] = useState<string>('');
  const [price, setPrice] = useState(0);

  const [_trans, setTranslate] = useCurrentTranslate();

  useEffect(() => {
    console.log('outputText:', outputText);
    console.log('thinkingText:', thinkingText);
    if(!outputText && !thinkingText) return;
    if(!_trans) return;
    setTranslate( {
      ..._trans,
      output: outputText,
      thinking: thinkingText
    });
  }, [outputText, thinkingText]);



  const startTranslate = async (trans: Translation) => {
    if(!trans)return;
    setOutputText('');
    setThinkingText('');
    setPrice(0);
    
    updateStatus({ isProcessing: true, status: '开始翻译' });

    await m_processText(
      explain,
      apiKey,
      trans.input || '',
      selectedModel,
      (value: boolean) => updateStatus({ showConfigModal: value }),
      (value: boolean) => updateStatus({ isProcessing: value }),
      (value: string) => updateStatus({ status: value }),
      setOutputText,
      setThinkingText,
      setPrice,
      currentModel
    );
    

    const newTrans = {
            ...trans,
            output: outputText,
            thinking: thinkingText,
            price: price,
          };
          console.log('new translation:', newTrans);
          setTranslate(undefined);
          addTranslationToTopic && addTranslationToTopic(newTrans);
  };

  return {startTranslate};
};
