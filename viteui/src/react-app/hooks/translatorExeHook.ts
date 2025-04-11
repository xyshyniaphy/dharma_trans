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
  const [_trans, setTranslate] = useCurrentTranslate();

  const startTranslate = async (trans: Translation) => {
    if(!trans) return;
    
    const newTrans = await m_processText(
      explain,
      apiKey,
      trans,
      selectedModel,
      updateStatus,
      setTranslate,
      currentModel
    );
    
    setTranslate(undefined);
    if(!newTrans) return;
    
    console.log('new translation:', newTrans);
    addTranslationToTopic && addTranslationToTopic(newTrans);
  };

  return {startTranslate};
};
