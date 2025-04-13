import React, { useState } from 'react';
import { ListGroup, Button, Dropdown } from 'react-bootstrap';
import styles from './ViewHistory.module.css'; // Import CSS module
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesomeIcon
import { faEllipsisV, faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons'; // Import specific icons

// Removed import for useCurrentTopicId
// import { useCurrentTopicId } from './hooks/currentTopicHook'; 
import { useDTConfig } from './hooks/configHook'; // Added import for useDTConfig
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

    // Removed useCurrentTopicId hook call
    // const { setCurrentTopicId, currentTopicId } = useCurrentTopicId(); 
    const { config, updateConfig } = useDTConfig(); // Added useDTConfig hook call

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    // Removed hoveredTopicId state

    const handleDeleteTopic = (topicId: string) => {
        if (window.confirm('确定要删除这个话题吗？\n删除后无法恢复')) {
            deleteTopic(topicId);
            // If the deleted topic was the current one, reset current topic in config
            if (config.topicId === topicId) {
                updateConfig({ topicId: '' }); 
            }
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

    // I have a drop down for each topic,  the dropdown is shown when the mouse is over the whole topic
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
            {topics.map((item) => (
                // Apply CSS module class and remove hover handlers
                <div 
                    className={styles.topicItemContainer} // Use CSS module class
                    key={item.topicId}
                    // Removed onMouseEnter/onMouseLeave
                >
                    {/* ListGroup.Item now only contains the topic name and handles click */}
                    <ListGroup.Item
                        action={item.topicId !== config.topicId} // Renders as button if not current, using config.topicId
                        className={item.topicId === config.topicId ? 'text-primary' : ''} // Removed flex classes, using config.topicId
                        onClick={() => updateConfig({ topicId: item.topicId })} // Use updateConfig to set topicId
                    >
                        <span>{item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}</span>
                    </ListGroup.Item>
                    {/* Apply CSS module class to dropdown container */}
                    <div 
                        className={styles.dropdownContainer} // Use CSS module class
                        // Removed inline positioning classes, handled by CSS module now
                    >
                        <Dropdown onClick={(e) => e.stopPropagation()}>
                            <Dropdown.Toggle
                                variant="link"
                                className="p-0 text-decoration-none border-0" // Added border-0
                                // Removed inline style, handled by CSS module now
                            >
                                {/* Replaced Bootstrap icon with FontAwesome icon */}
                                <FontAwesomeIcon icon={faEllipsisV} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {/* Replaced Bootstrap icon with FontAwesome icon */}
                                <Dropdown.Item onClick={() => handleRenameTopic(item)}>
                                    <FontAwesomeIcon icon={faPencilAlt} className="me-2" />重命名主题
                                </Dropdown.Item>
                                {/* Replaced Bootstrap icon with FontAwesome icon */}
                                <Dropdown.Item onClick={() => handleDeleteTopic(item.topicId)}>
                                    <FontAwesomeIcon icon={faTrashAlt} className="me-2" />删除
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
