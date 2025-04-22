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
//import { useTopics } from './hooks/topicsHook'; // Import useTopics
//import { clearTopics } from './hooks/topicsHook'; // Import clearTopics

const App: React.FC = () => {
    // Get showLeftPanel from config, updateConfig from useDTConfig
    const { loaded, config, initConfig, updateConfig } = useDTConfig();
    // Remove showLeftPanel from useTranslatorStatus
    const [{ isProcessing }, updateStatus] = useTranslatorStatus();
    const { topics, topicsInited, initTopics, createTopic, deleteTopic, updateTopic, addTranslationToTopic, deleteTranslation, clearTopics } = useTopicsManager();
    const { updateTranslationExpansionState } = useTransHistory(); // Get the update function
    //const { clearTopics } = useTopics();

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
              // Use config.showLeftPanel and updateConfig
              showLeftPanel={config.showLeftPanel}
              setShowLeftPanel={(value) => updateConfig({ showLeftPanel: value })}
              setShowConfigModal={(value) => updateStatus({ showConfigModal: value })}
            />
            <hr />
            {/* Make Row take remaining height and behave as flex container */}
            <Row className="flex-grow-1" style={{ minHeight: 0 }}>
                {/* Left Panel - Conditional rendering */}
                {config.showLeftPanel && (
                    // Ensure left panel also stretches if needed or has its own scroll
                    <Col md={3} className="p-3 d-flex flex-column">
                        <ViewHistory
                            topics={topics}
                            createTopic={createTopic}
                            deleteTopic={deleteTopic}
                            updateTopic={updateTopic}
                        />
                    </Col>
                )}
                {/* Main Panel - Make Col take remaining height */}
                <Col md={config.showLeftPanel ? 9 : 12} className="p-3 d-flex flex-column">
                    {/* Input component will fill this Col via its .input-container height: 100% */}
                    <Input
                        addTranslationToTopic={addTranslationToTopic}
                        deleteTranslation={deleteTranslation}
                        updateTranslationExpansion={updateTranslationExpansionState} // Pass down the update function
                    />
                </Col>
            </Row>

            {/* Config Modal */}
            <Config clearTopics={clearTopics} />

            {/* Progress Overlay */}
            {progressOverlay}
        </Container>
    );
};
export default App;
