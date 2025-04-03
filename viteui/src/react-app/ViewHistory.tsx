import React from 'react';
import { Modal, ListGroup } from 'react-bootstrap';

type ViewHistoryProps = {
  transHistory: Array<{input: string, output: string, thinking: string}>;
  setInputText: (text: string) => void;
  setOutputText: (text: string) => void;
  setThinkingText: (text: string) => void;
  show: boolean;
  onHide: () => void;
};

const ViewHistory: React.FC<ViewHistoryProps> = ({
  transHistory,
  setInputText,
  setOutputText,
  setThinkingText,
  show,
  onHide,
}) => {
  const handleSelect = (item: {input: string, output: string, thinking: string}) => {
    setInputText(item.input);
    setOutputText(item.output);
    setThinkingText(item.thinking);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Translation History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
      </Modal.Body>
    </Modal>
  );
};

export default ViewHistory;
