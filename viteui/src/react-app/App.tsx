// src/react-app/App.tsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { useLocalStorage } from './hooks/useLocalStorage';
import Config from './Config';
import Input from './Input';
import { DNavBar } from './DNavBar';
import ViewHistory from './ViewHistory';
import { Translation } from './translation_interface';
import { OpenRouterModel } from './hooks/filterModels';
import { useCurrentModel } from './hooks/currentModelHook';
import { useDTConfig } from './hooks/configHook';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';

const apiUrl = import.meta.env.VITE_OPENAI_URL;

const App: React.FC = () => {
    const { config } = useDTConfig();
    const { apiKey, selectedModel,loaded } = config;
    const [currentModel] = useCurrentModel();

    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [thinkingText, setThinkingText] = useState<string>('');

    const [{ status, isProcessing, showConfigModal, showLeftPanel }, updateStatus] = useTranslatorStatus();

    
    //todo : use recoil 
    const [transHistory, setTransHistory] = useLocalStorage<Array<Translation>>('trans_history', []);
    const [translate, setTranslate] = useCurrentTranslate();
    
    


    const handleHideConfigModal = () => {
        updateStatus({ showConfigModal: false });
    };

    useEffect(() => {
        if(!loaded) return;
        if (!apiKey) {
            updateStatus({ showConfigModal: true }); 
        }
    }, [apiKey,loaded]);



    if(!loaded) return null;

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
                        transHistory={transHistory}
                    />
                </Col>
                <Col md={showLeftPanel ? 9 : 12} className="p-3">
                    {/* Main Panel - Replaced with Input component */}
                    <Input/>
                </Col>
            </Row>

            {/* Config Modal */}
            <Config
                onClose={handleHideConfigModal}
                showModal={showConfigModal}
                transHistory={transHistory}
                setTransHistory={setTransHistory}
            />

            {/* Full-screen overlay with progress circle */}
            {isProcessing && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(196, 196, 196, 0.2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
        </Container>
    );
};
export default App;
