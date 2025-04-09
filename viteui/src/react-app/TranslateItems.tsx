import React, { useEffect, useState } from 'react';
import { TranslateItem } from './TranslateItem';
import { Translation } from './interface/translation_interface';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import { useDTConfig } from './hooks/configHook';
import m_processText from './utils/translate_tool';
import { useCurrentModel } from './hooks/currentModelHook';
import { useTransHistory } from './hooks/transHistoryHook';
import { Table } from 'react-bootstrap'; // Add Table import

type TranslateItemsProps = {
  translations: Translation[];
};

export const TranslateItems: React.FC<TranslateItemsProps> = ({
  translations
}) => {
  const { config } = useDTConfig();
  const { explain, apiKey, selectedModel } = config;

  const [currentModel] = useCurrentModel();

  const [{ status }, updateStatus] = useTranslatorStatus();

  //used for realtime translation stream
  const [outputText, setOutputText] = useState<string>('');
  const [thinkingText, setThinkingText] = useState<string>('');

  const [price, setPrice] = useState(0);

  const [_, insertTransHistory, _deleteTransHistory] = useTransHistory();
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
      setTranslate(undefined);
      insertTransHistory(newTrans);
      updateStatus({ status: '翻译完成' });
    }
  }, [status]);

  if (!translations || translations.length === 0) return null;
  
  if(translate)return  (<div className="d-flex flex-column gap-3">
    <TranslateItem
      translation={translate}
      key={translate.timestamp}
      outputText={outputText}
      thinkingText={thinkingText}
    />
  </div>);

  return (
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
            key={translation.timestamp}
            translation={translation}
          />
        ))}
      </tbody>
    </Table>
    
  );
};