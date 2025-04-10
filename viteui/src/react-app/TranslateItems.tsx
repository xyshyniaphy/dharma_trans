import React, { useEffect, useState } from 'react';
import { TranslateItem } from './TranslateItem';
import { Translation } from './interface/translation_interface';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useTransHistory } from './hooks/transHistoryHook';
import CurrentTranslateItem from './CurrentTranslateItem';
import { Table } from 'react-bootstrap';

type TranslateItemsProps = {
};

export const TranslateItems: React.FC<TranslateItemsProps> = ({ 
}) => {
  
  const { transHistory } = useTransHistory();
  const [translate] = useCurrentTranslate();

  const currentTransItem = translate ? <CurrentTranslateItem /> : null;
  
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
        {currentTransItem}
        {transHistory.map((translation: Translation) => (
          <TranslateItem
            key={translation.timestamp}
            translation={translation}
          />
        ))}
      </tbody>
    </Table>
    
  );
};