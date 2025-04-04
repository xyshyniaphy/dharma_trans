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

const apiUrl = import.meta.env.VITE_OPENAI_URL;

const App: React.FC = () => {
    const [explain, setExplain] = useLocalStorage<boolean>('EXPLAIN', false);
    const [apiKey, setApiKeyState] = useLocalStorage<string>('OPENROUTER_API_KEY', '');
    const [selectedModel, setSelectedModel] = useLocalStorage<string>('SELECTED_MODEL', 'google/gemini-2.5-pro-exp-03-25:free');
    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [thinkingText, setThinkingText] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showConfigModal, setShowConfigModal] = useState<boolean>(false); 
    const [transHistory, setTransHistory] = useLocalStorage<Array<Translation>>('trans_history', []);
    const [translate, setTranslate] = useState<Translation | undefined>();
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [currentModel, setCurrentModel] = useState<OpenRouterModel | null>(null);
    const [price, setPrice] = useState(0);

    const processText = async () => {
        setTranslate(undefined);
        await m_processText(explain,apiKey, inputText, selectedModel, apiUrl, setShowConfigModal, setIsProcessing, setStatus, setOutputText, setThinkingText, setPrice, currentModel);
    };
    const setTransAndTxt = (trans: Translation | undefined) => {
        setTranslate(trans);
        setInputText(trans?.input ?? '');
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
                price: price
            };
            const newHistory = [...transHistory, newTrans];
            setTranslate(newTrans);
            setTransHistory(newHistory);
            setStatus('');
        }
    }, [isProcessing,outputText,status]);

    const handleHideConfigModal = () => {
        setShowConfigModal(false);
    };

    useEffect(() => {
        if (!apiKey) {
            setShowConfigModal(true); 
        }
    }, [apiKey]);

    //user input changed , so clear previous translation
    useEffect(() => {
        if (!translate) return;
        if(translate.input !== inputText) {
          setTranslate(undefined);
          if(outputText) {
            setOutputText('');
          }
          if(thinkingText) {
            setThinkingText('');
          }
          if(status) {
            setStatus('');
          }
        }
    }, [inputText]);

    //click delete button on input
    const removeFromHistory = () => {
        if(!translate) return;
        const updatedHistory = transHistory.filter(t => t.timestamp !== translate.timestamp);
        setTransHistory(updatedHistory);
        setStatus('');
        setOutputText('');
        setThinkingText('');
        setTranslate(undefined);
    };

    return (
        <Container fluid className="vh-95">
            <DNavBar 
              showLeftPanel={showLeftPanel}
              setShowLeftPanel={setShowLeftPanel}
              setShowConfigModal={setShowConfigModal}
            />
            <hr />
            <Row className="h-90">
                <Col md={3} className={`p-3 ${showLeftPanel ? 'd-block' : 'd-none'}`}>
                    {/* Left Panel */}
                    <ViewHistory
                        transHistory={transHistory}
                        setTrans={setTransAndTxt}
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
                apiKey={apiKey}
                setApiKeyState={setApiKeyState}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                transHistory={transHistory}
                setTransHistory={setTransHistory}
                currentModel={currentModel}
                setCurrentModel={setCurrentModel}
                explain={explain}
                setExplain={setExplain}
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
