import React from 'react';
import { TranslateItem } from './TranslateItem';
import { Translation } from './translation_interface';
import { useCurrentTranslate } from './hooks/currentTranslateHook';

type TranslateItemsProps = {
  translations: Translation[];
  removeFromHistory: (id: string) => void;
};

export const TranslateItems: React.FC<TranslateItemsProps> = ({
  translations,
  removeFromHistory,
}) => {

  const [translate, setTranslate] = useCurrentTranslate();
      
  if(!translations || translations.length === 0) return null;
  const currentTranslation = translate ? 
  (<div className="d-flex flex-row flex-wrap gap-3">
    {translations.map((translation) => (
      <TranslateItem
        key={translation.translateId}
        translation={translation}
        removeFromHistory={() => removeFromHistory(translation.translateId)}
      />
    ))}
  </div>)
  : null;

  return (
    <>
    {currentTranslation}
    <div className="d-flex flex-row flex-wrap gap-3">
      {translations.map((translation) => (
        <TranslateItem
          key={translation.translateId}
          translation={translation}
          removeFromHistory={() => removeFromHistory(translation.translateId)}
        />
      ))}
    </div>
    </>
  );
};
