import React from 'react';
import { ListGroup } from 'react-bootstrap';

import { Translation } from './translation_interface';

type ViewHistoryProps = {
  transHistory: Array<Translation>;
  setInputText: (text: string) => void;
  setOutputText: (text: string) => void;
  setThinkingText: (text: string) => void;
};

const ViewHistory: React.FC<ViewHistoryProps> = ({
  transHistory,
  setInputText,
  setOutputText,
  setThinkingText,
}) => {
  const handleSelect = (item: Translation) => {
    setInputText(item.input);
    setOutputText(item.output);
    setThinkingText(item.thinking);
  };

  return (
    <ListGroup>
    {transHistory.map((item, _) => (
      <ListGroup.Item
        key={item.timestamp}
        action
        onClick={() => handleSelect(item)}
      >
        {item.input.length > 10 ? `${item.input.slice(0, 10)}...` : item.input}
      </ListGroup.Item>
    ))}
  </ListGroup>
  );
};

export default ViewHistory;
