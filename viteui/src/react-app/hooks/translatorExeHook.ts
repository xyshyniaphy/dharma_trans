import { useState } from 'react';
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

  const [_trans, setTranslate] = useCurrentTranslate();

  const translate = async (input: string) => {
    updateStatus({ isProcessing: true, status: '开始翻译' })
    setTranslate({
        input: input,
        output: '',
        thinking: '',
        timestamp: Date.now(),
        modelName: currentModel?.name || '',
        price: 0,
        topicId: '',
        translateId: Date.now().toString()+ "_" + (Math.random()*1000).toFixed(0),
        modelId: currentModel?.id || ''
    });

    await m_processText(
      explain,
      apiKey,
      input,
      selectedModel,
      (value: boolean) => updateStatus({ showConfigModal: value }),
      (value: boolean) => updateStatus({ isProcessing: value }),
      (value: string) => updateStatus({ status: value }),
      setOutputText,
      setThinkingText,
      setPrice,
      currentModel
    );
  };

  return {
    outputText,
    thinkingText,
    price,
    status,
    translate
  };
};
