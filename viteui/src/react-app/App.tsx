// src/react-app/App.tsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { useLocalStorage } from './hooks/useLocalStorage';
import Config from './Config';
import Input from './Input';
import { DNavBar } from './DNavBar';
import ViewHistory from './ViewHistory';
import m_processText from './translate_tool';
import { Translation } from './translation_interface';
import { OpenRouterModel } from './hooks/filterModels';
import { useCurrentModel } from './hooks/currentModelHook';
import { useDTConfig } from './hooks/configHook';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';

const apiUrl = import.meta.env.VITE_OPENAI_URL;

const App: React.FC = () => {
    const { config } = useDTConfig();
    const { explain, apiKey, selectedModel,loaded } = config;
    const [currentModel] = useCurrentModel();

    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [thinkingText, setThinkingText] = useState<string>('');

    const [{ status, isProcessing, showConfigModal, showLeftPanel }, updateStatus] = useTranslatorStatus();
    const [transHistory, setTransHistory] = useLocalStorage<Array<Translation>>('trans_history', []);
    const [translate, setTranslate] = useCurrentTranslate();
    
    const [price, setPrice] = useState(0);

    const processText = async () => {
        setTranslate(undefined);
        await m_processText(
            explain,
            apiKey, 
            inputText, 
            selectedModel, 
            apiUrl, 
            (value) => updateStatus({ showConfigModal: value }),
            (value) => updateStatus({ isProcessing: value }),
            (value) => updateStatus({ status: value }),
            setOutputText, 
            setThinkingText, 
            setPrice, 
            currentModel
        );
    };

    useEffect(() => {
        if (isProcessing || status !== '翻译完成') {
            return;
        }
        if (outputText && inputText) {
            const newTrans ={
                input: inputText,
                output: outputText,
                thinking: thinkingText,
                timestamp: Date.now(),
                modelName: selectedModel,
                price: price,
                topicId: '',
                translateId: '',
                modelId: currentModel?.id || ''
            };
            const newHistory = [...transHistory, newTrans];
            setTranslate(newTrans);
            setTransHistory(newHistory);
            updateStatus({ status: '' });
        }
    }, [isProcessing,outputText,status]);

    const handleHideConfigModal = () => {
        updateStatus({ showConfigModal: false });
    };

    useEffect(() => {
        if(!loaded) return;
        if (!apiKey) {
            updateStatus({ showConfigModal: true }); 
        }
    }, [apiKey,loaded]);

    //click delete button on input
    const removeFromHistory = () => {
        if(!translate) return;
        const updatedHistory = transHistory.filter(t => t.timestamp !== translate.timestamp);
        setTransHistory(updatedHistory);
        updateStatus({ status: '' });
        setOutputText('');
        setThinkingText('');
        setTranslate(undefined);
    };

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
                    <Input
                        inputText={inputText}
                        outputText={outputText}
                        thinkingText={thinkingText}
                        isProcessing={isProcessing}
                        status={status}
                        setInputText={setInputText}
                        processText={processText}
                        translation={translate}
                        removeFromHistory={removeFromHistory}
                        selectedModel={selectedModel}
                    />
                   
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
