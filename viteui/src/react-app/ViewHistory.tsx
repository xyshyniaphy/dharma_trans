import React from 'react';
import {   ListGroup } from 'react-bootstrap';

type ViewHistoryProps = {
  transHistory: Array<{input: string, output: string, thinking: string}>;
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
  const handleSelect = (item: {input: string, output: string, thinking: string}) => {
    setInputText(item.input);
    setOutputText(item.output);
    setThinkingText(item.thinking);
  };

  return (
    <ListGroup>
    {transHistory.map((item, index) => (
      <ListGroup.Item
        key={index}
        action
        onClick={() => handleSelect(item)}
      >
        {`Input: ${item.input}\nOutput: ${item.output}\nThinking: ${item.thinking}`}
      </ListGroup.Item>
    ))}
  </ListGroup>
  );
};

export default ViewHistory;
