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
  const [currentTranslate, setTranslate] = useCurrentTranslate();

  useEffect(() => {
    if (status === '翻译完成' && currentTranslate !== undefined) {
      const newTrans = {
        ...currentTranslate,
        output: outputText,
        thinking: thinkingText,
        price: price,
      };
      console.log('new translation:', newTrans);
      setTranslate(undefined);
      addTranslationToTopic && addTranslationToTopic(newTrans);
    }
  }, [status]);

  if(!currentTranslate) return null;

  return (
      <TranslateItem
        translation={currentTranslate}
        key={currentTranslate.timestamp}
        outputText={outputText}
        thinkingText={thinkingText}
      />
  );
}
