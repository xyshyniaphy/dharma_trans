import React from 'react';
import { ListGroup } from 'react-bootstrap';

import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useTransHistory } from './hooks/transHistoryHook';

type ViewHistoryProps = {
};

const ViewHistory: React.FC<ViewHistoryProps> = ({
}) => {
  const [transHistory, _insertTransHistory, _deleteTransHistory] = useTransHistory();
  const [_, setTranslate] = useCurrentTranslate();
  return (
    <ListGroup>
    {transHistory.map((item, index) => (
      <ListGroup.Item
        key={index}
        action
        onClick={() => setTranslate(item)}
      >
        {item.input.length > 10 ? `${item.input.slice(0, 10)}...` : item.input}
      </ListGroup.Item>
    ))}
  </ListGroup>
  );
};

export default ViewHistory;
