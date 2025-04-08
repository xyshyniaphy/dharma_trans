import React from 'react';
import { ListGroup } from 'react-bootstrap';

import { Translation } from './translation_interface';
import { useCurrentTranslate } from './hooks/currentTranslateHook';

type ViewHistoryProps = {
  transHistory: Array<Translation>;
};

const ViewHistory: React.FC<ViewHistoryProps> = ({
  transHistory
}) => {
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
