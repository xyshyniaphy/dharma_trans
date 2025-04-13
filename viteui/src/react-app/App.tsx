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
import { useTransHistory } from './hooks/transHistoryHook'; // Import useTransHistory

const App: React.FC = () => {
    const [{ isProcessing, showLeftPanel }, updateStatus] = useTranslatorStatus();
    const { topics, topicsInited, initTopics, createTopic, deleteTopic, updateTopic, addTranslationToTopic, deleteTranslation } = useTopicsManager();
    const { updateTranslationExpansionState } = useTransHistory(); // Get the update function

    const { loaded, initConfig } = useDTConfig();
    //console.log('App config:', config);
    //console.log('App loaded:', loaded);


    // Initialize config when component mounts
    // dependency must be empty, no dependency!!
  //do not add dependency to useEffect
    useEffect(() => {
        initConfig();
    }, []);//must be empty, no dependency!!

    //do not add dependency to useEffect
    useEffect(() => {
        if(!loaded) return;
        // Initialize topics when config is loaded
        initTopics();
    }, [loaded]); // Added initTopics to dependency array


    if(!loaded || !topicsInited) return null; // Don't render until config is loaded

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
                {/* Left Panel - Conditional rendering */}
                {showLeftPanel && (
                    <Col md={3} className="p-3">
                        <ViewHistory
                            topics={topics}
                            createTopic={createTopic}
                            deleteTopic={deleteTopic}
                            updateTopic={updateTopic}
                        />
                    </Col>
                )}
                {/* Main Panel - Adjust column size based on left panel visibility */}
                <Col md={showLeftPanel ? 9 : 12} className="p-3">
                    <Input
                        addTranslationToTopic={addTranslationToTopic}
                        deleteTranslation={deleteTranslation}
                        updateTranslationExpansion={updateTranslationExpansionState} // Pass down the update function
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
