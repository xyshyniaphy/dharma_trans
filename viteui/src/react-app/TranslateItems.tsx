import React, { useEffect, useState } from 'react';
import { TranslateItem } from './TranslateItem';
import { Translation } from './translation_interface';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import { useDTConfig } from './hooks/configHook';
import m_processText from './translate_tool';
import { useCurrentModel } from './hooks/currentModelHook';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Table } from 'react-bootstrap'; // Add Table import

type TranslateItemsProps = {
  translations: Translation[];
  removeFromHistory: (id: string) => void;
};

export const TranslateItems: React.FC<TranslateItemsProps> = ({
  translations,
  removeFromHistory,
}) => {
  const { config } = useDTConfig();
  const { explain, apiKey, selectedModel } = config;

  const [currentModel] = useCurrentModel();

  const [{ status, isProcessing }, updateStatus] = useTranslatorStatus();

  //used for realtime translation stream
  const [outputText, setOutputText] = useState<string>('');
  const [thinkingText, setThinkingText] = useState<string>('');

  const [price, setPrice] = useState(0);

  //todo : use recoil 
  const [transHistory, setTransHistory] = useLocalStorage<Array<Translation>>('trans_history', []);
  const [translate, setTranslate] = useCurrentTranslate();

  const processText = async () => {
    await m_processText(
      explain,
      apiKey,
      translate?.input ?? '',
      selectedModel,
      (value) => updateStatus({ showConfigModal: value }),
      (value) => updateStatus({ isProcessing: value }),
      (value) => updateStatus({ status: value }),
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
      const newHistory = [...transHistory, newTrans];
      setTranslate(undefined);
      setTransHistory(newHistory);
      updateStatus({ status: '翻译完成' });
    }
  }, [status]);

  if (!translations || translations.length === 0) return null;
  const currentTranslation = translate ? 
    (<div className="d-flex flex-column gap-3">
      {translations.map((translation) => (
        <TranslateItem
          key={translation.translateId}
          translation={translation}
          removeFromHistory={() => removeFromHistory(translation.translateId)}
          outputText={outputText}
          thinkingText={thinkingText}
        />
      ))}
    </div>)
    : null;

  return (
    <>
      {currentTranslation}
      <Table bordered responsive className="table-striped">
        <thead>
          <tr>
            <th style={{ width: '33.33%' }}>原文</th>
            <th style={{ width: '33.33%' }}>翻译结果</th>
            <th style={{ width: '33.33%' }}>思考</th>
          </tr>
        </thead>
        <tbody>
          {translations.map((translation) => (
            <TranslateItem
              key={translation.translateId}
              translation={translation}
              removeFromHistory={() => removeFromHistory(translation.translateId)}
              outputText={translate?.translateId === translation.translateId ? outputText : undefined}
              thinkingText={translate?.translateId === translation.translateId ? thinkingText : undefined}
            />
          ))}
        </tbody>
      </Table>
    </>
  );
};