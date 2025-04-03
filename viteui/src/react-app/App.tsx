// src/react-app/App.tsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, Collapse } from 'react-bootstrap';
import { useLocalStorage } from './hooks/useLocalStorage';
import Config from './Config';
import Input from './Input';
import ViewHistory from './ViewHistory';
import m_processText from './translate_tool';

const apiUrl = import.meta.env.VITE_OPENAI_URL;

const App: React.FC = () => {
    const [apiKey, setApiKeyState] = useLocalStorage<string>('OPENROUTER_API_KEY', '');
    const [selectedModel, setSelectedModel] = useLocalStorage<string>('SELECTED_MODEL', 'google/gemini-2.5-pro-exp-03-25:free');
    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [thinkingText, setThinkingText] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showConfigModal, setShowConfigModal] = useState<boolean>(false); 
    const [transHistory, setTransHistory] = useLocalStorage<Array<{input: string, output: string, thinking: string}>>('trans_history', []);
    const [showHistory, setShowHistory] = useState(false);
    const [showLeftPanel, setShowLeftPanel] = useState(true);

    const processText = async () => {
        if (outputText) {
            setTransHistory([...transHistory, { input: inputText, output: outputText, thinking: thinkingText }]);
        }
        await m_processText(apiKey, inputText, selectedModel, apiUrl, setShowConfigModal, setIsProcessing, setStatus, setOutputText, setThinkingText, setTransHistory);
    };

    const handleHideConfigModal = () => {
        setShowConfigModal(false);
    };

    useEffect(() => {
        if (!apiKey) {
            setShowConfigModal(true); 
        }
    }, [apiKey]);

    return (
        <Container fluid className="vh-95">
            <Navbar bg="light" expand="lg">
                <Nav.Link onClick={() => setShowLeftPanel(!showLeftPanel)}>记录</Nav.Link>
                <Navbar.Brand>中翻英</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Nav.Link onClick={() => setShowConfigModal(true)}>设置</Nav.Link>
                <Navbar.Collapse id="basic-navbar-nav">
                </Navbar.Collapse>
            </Navbar>

            <Row className="h-90">
                <Col md={3} className={`bg-light p-3 ${showLeftPanel ? 'd-block' : 'd-none'}`}>
                    {/* Left Panel */}
                   
                    <ViewHistory
                        transHistory={transHistory}
                        setInputText={setInputText}
                        setOutputText={setOutputText}
                        setThinkingText={setThinkingText}
                        show={showHistory}
                        onHide={() => setShowHistory(false)}
                    />
                </Col>
                <Col md={9} className="p-3">
                    {/* Main Panel - Replaced with Input component */}
                    <Input
                        inputText={inputText}
                        outputText={outputText}
                        thinkingText={thinkingText}
                        isProcessing={isProcessing}
                        status={status}
                        setInputText={setInputText}
                        processText={processText}
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
            />
        </Container>
    );
};
export default App;
