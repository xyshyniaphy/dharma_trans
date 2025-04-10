import React from 'react';
import { ListGroup } from 'react-bootstrap';

import { useTopicsManager } from './hooks/topicsMgr';
import { useCurrentTopicId } from './hooks/currentTopicHook';

type ViewHistoryProps = {};

const ViewHistory: React.FC<ViewHistoryProps> = ({
}) => {

  const { topics } = useTopicsManager();

  const { setCurrentTopicId } = useCurrentTopicId();
  return (
    <ListGroup>
    {topics.map((item, index) => (
      <ListGroup.Item
        key={index}
        action
        onClick={() => setCurrentTopicId(item.topicId)}
      >
        {item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}
      </ListGroup.Item>
    ))}
  </ListGroup>
  );
};

export default ViewHistory;
