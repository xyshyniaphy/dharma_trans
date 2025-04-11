import { useEffect, useState } from 'react';
import { useDTConfig } from './configHook';
import { useCurrentModel } from './currentModelHook';
import { useTranslatorStatus } from './useTranslatorStatus';
import m_processText from '../utils/translate_tool';
import { useCurrentTranslate } from './currentTranslateHook';

export const useTranslatorExe = () => {
  const { config } = useDTConfig();
  const { explain, apiKey, selectedModel } = config;
  const [currentModel] = useCurrentModel();
  const [{ status }, updateStatus] = useTranslatorStatus();
  
  const [outputText, setOutputText] = useState<string>('');
  const [thinkingText, setThinkingText] = useState<string>('');
  const [price, setPrice] = useState(0);

  const [trans, _setTranslate] = useCurrentTranslate();

  useEffect(() => {
    setTimeout(() => {
      if(!trans || status !== '开始翻译')return;
      updateStatus({ status: '翻译中' });
      console.log('开始翻译');
      m_processText(
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
    }, 50);
  }, [status, trans]);  


  return {
    outputText,
    thinkingText,
    price,
    status
  };
};
