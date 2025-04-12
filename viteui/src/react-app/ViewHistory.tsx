import React, { useState } from 'react';
import { ListGroup, Button, Dropdown } from 'react-bootstrap';

import { useCurrentTopicId } from './hooks/currentTopicHook';
import { useTheme } from './hooks/useTheme';
import TopicEdit from './TopicEdit';
import { Topic } from './interface/topic_interface';

type ViewHistoryProps = {
    topics: Topic[];
    createTopic: (name: string) => void;
    deleteTopic: (topicId: string) => void;
    updateTopic: (topicId: string, updates: Partial<Topic>) => void;
};

const ViewHistory: React.FC<ViewHistoryProps> = ({
    topics,
    createTopic,
    deleteTopic,
    updateTopic
}) => {

    const { setCurrentTopicId, currentTopicId } = useCurrentTopicId();
    const { activeBgClass, activeTextClass } = useTheme();

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

    const handleDeleteTopic = (topicId: string) => {
        if (window.confirm('确定要删除这个话题吗？\n删除后无法恢复')) {
            deleteTopic(topicId);
        }
    };

    const handleRenameTopic = (topic: Topic) => {
        setSelectedTopic(topic);
        setShowRenameModal(true);
    };

    const handleRenameTopicSubmit = (newTopicName: string, topicId: string) => {
        updateTopic(topicId, { name: newTopicName });
        setShowRenameModal(false);
    };

    const renameEdit =showRenameModal? (
        <TopicEdit 
            show={showRenameModal}
            onClose={() => setShowRenameModal(false)}
            currentName={selectedTopic?.name || ''}
            onSave={(newName) => handleRenameTopicSubmit(newName, selectedTopic?.topicId || '新话题')}
        />
    ):null;

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
                <div className="position-relative">
                    <ListGroup.Item
                        key={index}
                        action={item.topicId !== currentTopicId}
                        className={item.topicId === currentTopicId ? `${activeBgClass} ${activeTextClass}` : ''}
                        onClick={() => setCurrentTopicId(item.topicId)}
                    >
                        <div className="d-flex justify-content-between align-items-center">
                            <span>{item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}</span>
                        </div>
                    </ListGroup.Item>
                    <div 
                        className="position-absolute end-0 top-50 translate-middle-y me-2"
                        onMouseEnter={(e) => {
                            const toggle = e.currentTarget.querySelector('.dropdown-toggle') as HTMLElement;
                            if (toggle) toggle.style.visibility = 'visible';
                        }}
                        onMouseLeave={(e) => {
                            const toggle = e.currentTarget.querySelector('.dropdown-toggle') as HTMLElement;
                            if (toggle) toggle.style.visibility = 'hidden';
                        }}
                    >
                        <Dropdown onClick={(e) => e.stopPropagation()}>
                            <Dropdown.Toggle 
                                variant="link" 
                                className="p-0 text-decoration-none" 
                                style={{ visibility: 'hidden' }}
                            >
                                <i className="bi bi-three-dots-vertical"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleRenameTopic(item)}><i className="bi bi-pencil me-2"></i>重命名主题</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleDeleteTopic(item.topicId)}>
                                    <i className="bi bi-trash me-2"></i>删除
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>
            ))}
            </ListGroup>
            {renameEdit}
        </>
    );
};

export default ViewHistory;
