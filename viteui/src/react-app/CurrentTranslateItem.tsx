import { Translation } from './interface/translation_interface';
import { useCurrentModel } from './hooks/currentModelHook';
import { useDTConfig } from './hooks/configHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useState, useEffect } from 'react';
import { TranslateItem } from './TranslateItem';
import m_processText from './utils/translate_tool';

type CurrentTranslateItemProps = {
  addTranslationToTopic?: (translation: Translation) => Promise<void>;
};

export default function CurrentTranslateItem({ addTranslationToTopic }: CurrentTranslateItemProps) {
  const { config } = useDTConfig();
  const { explain, apiKey, selectedModel } = config;

  const [currentModel] = useCurrentModel();


  const [{ status }, updateStatus] = useTranslatorStatus();

  //used for realtime translation stream
  const [outputText, setOutputText] = useState<string>('');
  const [thinkingText, setThinkingText] = useState<string>('');

  const [price, setPrice] = useState(0);
  const [translate, setTranslate] = useCurrentTranslate();

  const processText = async () => {
    await m_processText(
      explain,
      apiKey,
      translate?.input ?? '',
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

  useEffect(() => {
    if (status === '开始翻译') {
      
      processText();
    } else if (status === '翻译完成' && translate !== undefined) {
      const newTrans = {
        ...translate,
        output: outputText,
        thinking: thinkingText,
        price: price,
      };
      console.log('new translation:', newTrans);
      setTranslate(undefined);
      addTranslationToTopic && addTranslationToTopic(newTrans);
    }
  }, [status]);
  if(!translate) return null;

  return (
      <TranslateItem
        translation={translate}
        key={translate.timestamp}
        outputText={outputText}
        thinkingText={thinkingText}
      />
  );
}
