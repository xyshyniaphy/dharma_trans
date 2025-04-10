import { Translation } from './interface/translation_interface';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useEffect } from 'react';
import { TranslateItem } from './TranslateItem';
import { useTranslatorExe } from './hooks/translatorExeHook';

type CurrentTranslateItemProps = {
  addTranslationToTopic?: (translation: Translation) => Promise<void>;
};

export default function CurrentTranslateItem({ addTranslationToTopic }: CurrentTranslateItemProps) {
  const { outputText, thinkingText, price, status } = useTranslatorExe();
  const [translateState, setTranslate] = useCurrentTranslate();

  useEffect(() => {
    if (status === '翻译完成' && translateState !== undefined) {
      const newTrans = {
        ...translateState,
        output: outputText,
        thinking: thinkingText,
        price: price,
      };
      console.log('new translation:', newTrans);
      setTranslate(undefined);
      addTranslationToTopic && addTranslationToTopic(newTrans);
    }
  }, [status, translateState, addTranslationToTopic, setTranslate]);

  if(!translateState) return null;

  return (
      <TranslateItem
        translation={translateState}
        key={translateState.timestamp}
        outputText={outputText}
        thinkingText={thinkingText}
      />
  );
}
