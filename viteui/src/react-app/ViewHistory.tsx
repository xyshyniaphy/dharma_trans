import React from 'react';
import { ListGroup, Button } from 'react-bootstrap';

import { useTopicsManager } from './hooks/topicsMgr';
import { useCurrentTopicId } from './hooks/currentTopicHook';
import { useTheme } from './hooks/useTheme';

type ViewHistoryProps = {};

const ViewHistory: React.FC<ViewHistoryProps> = ({
}) => {

  const { topics, createTopic } = useTopicsManager();

  const { setCurrentTopicId, currentTopicId } = useCurrentTopicId();
  const { activeBgClass, activeTextClass } = useTheme();
  
  return (
    <>
      <Button 
        variant="info" 
        className="mb-3 w-100"
        onClick={() => createTopic('新话题')}
      >
        新建话题
      </Button>
      <ListGroup>
      {topics.map((item, index) => (
        <ListGroup.Item
          key={index}
          action={item.topicId !== currentTopicId}
          className={item.topicId === currentTopicId ? `${activeBgClass} ${activeTextClass}` : 'text-light'}
          onClick={() => setCurrentTopicId(item.topicId)}
        >
          {item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}
        </ListGroup.Item>
      ))}
    </ListGroup>
    </>
  );
};

export default ViewHistory;
