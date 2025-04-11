// src/react-app/App.tsx

import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Config from './Config';
import Input from './Input';
import { DNavBar } from './DNavBar';
import ViewHistory from './ViewHistory';
import { useDTConfig } from './hooks/configHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import { ProgressOverlay } from './ProgressOverlay';
import { useTopicsManager } from './hooks/topicsMgr';

const App: React.FC = () => {
    const [{ isProcessing, showLeftPanel }, updateStatus] = useTranslatorStatus();
    const { topics, initTopics, createTopic, deleteTopic, updateTopic, addTranslationToTopic, deleteTranslation } = useTopicsManager();

    const { config } = useDTConfig();
    const { loaded } = config;

    useEffect(() => {
        if(!loaded) return;
        initTopics();
    }, [loaded]);


    if(!loaded) return null;

    const progressOverlay = isProcessing ? <ProgressOverlay/> : null;


    return (
        <Container fluid className="vh-95">
            <DNavBar 
              showLeftPanel={showLeftPanel}
              setShowLeftPanel={(value) => updateStatus({ showLeftPanel: value })}
              setShowConfigModal={(value) => updateStatus({ showConfigModal: value })}
            />
            <hr />
            <Row className="h-90">
                <Col md={3} className={`p-3 ${showLeftPanel ? 'd-block' : 'd-none'}`}>
                    {/* Left Panel */}
                    <ViewHistory 
                        topics={topics}
                        createTopic={createTopic}
                        deleteTopic={deleteTopic}
                        updateTopic={updateTopic}
                    />
                </Col>
                <Col md={showLeftPanel ? 9 : 12} className="p-3">
                    {/* Main Panel - Replaced with Input component */}
                    <Input 
                        addTranslationToTopic={addTranslationToTopic}
                        deleteTranslation={deleteTranslation}
                    />
                </Col>
            </Row>

            {/* Config Modal */}
            <Config/>

            {/* Progress Overlay */}
            {progressOverlay}
        </Container>
    );
};
export default App;
