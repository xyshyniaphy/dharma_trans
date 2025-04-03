import React from 'react';
import { ListGroup } from 'react-bootstrap';

import { Translation } from './translation_interface';

type ViewHistoryProps = {
  transHistory: Array<Translation>;
  setTrans: (t: Translation) => void;
};

const ViewHistory: React.FC<ViewHistoryProps> = ({
  transHistory,
  setTrans,
}) => {
  const handleSelect = (item: Translation) => {
    setTrans(item);
  };

  return (
    <ListGroup>
    {transHistory.map((item, index) => (
      <ListGroup.Item
        key={index}
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
