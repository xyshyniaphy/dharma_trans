import React from 'react';
import { ListGroup, Button, Dropdown } from 'react-bootstrap';

import { useTopicsManager } from './hooks/topicsMgr';
import { useCurrentTopicId } from './hooks/currentTopicHook';
import { useTheme } from './hooks/useTheme';

type ViewHistoryProps = {};

const ViewHistory: React.FC<ViewHistoryProps> = ({
}) => {

  const { topics, createTopic, deleteTopic } = useTopicsManager();

  const handleDeleteTopic = (topicId: string) => {
    if (window.confirm('确定要删除这个话题吗？\n删除后无法恢复')) {
      deleteTopic(topicId);
    }
  };

  const { setCurrentTopicId, currentTopicId } = useCurrentTopicId();
  const { activeBgClass, activeTextClass } = useTheme();
  
  return (
    <>
      <Button 
        variant="outline-primary" 
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
          className={item.topicId === currentTopicId ? `${activeBgClass} ${activeTextClass}` : ''}
          onClick={() => setCurrentTopicId(item.topicId)}
        >
          <div 
            className="d-flex justify-content-between align-items-center"
            onMouseEnter={(e) => {
              const toggle = e.currentTarget.querySelector('.dropdown-toggle') as HTMLElement;
              if (toggle) toggle.style.visibility = 'visible';
            }}
            onMouseLeave={(e) => {
              const toggle = e.currentTarget.querySelector('.dropdown-toggle') as HTMLElement;
              if (toggle) toggle.style.visibility = 'hidden';
            }}
          >
            <span>{item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}</span>
            <Dropdown className="ms-2" onClick={(e) => e.stopPropagation()}>
              <Dropdown.Toggle 
                variant="link" 
                className="p-0 text-decoration-none" 
                style={{ visibility: 'hidden' }}
              >
                <i className="bi bi-three-dots-vertical"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleDeleteTopic(item.topicId)}>
                  <i className="bi bi-trash me-2"></i>删除
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
    </>
  );
};

export default ViewHistory;
