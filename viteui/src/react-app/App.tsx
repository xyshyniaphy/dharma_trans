// src/react-app/App.tsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav } from 'react-bootstrap';
import { useLocalStorage } from './hooks/useLocalStorage';
import Config from './Config';
import Input from './Input';

const apiUrl = import.meta.env.VITE_OPENAI_URL;
const promptApiUrl = import.meta.env.VITE_DHARMA_PROMPT_API_URL;


const fetchPrompt = async (text: string): Promise<string> => {
    const response = await fetch(promptApiUrl + '/get_prompt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
    });
    const data = await response.json();
    return data.prompt;
};

const m_processText = async (apiKey: string, inputText: string, selectedModel: string, apiUrl: string, setShowConfigModal: (show: boolean) => void, setIsProcessing: (processing: boolean) => void, setStatus: (status: string) => void, setOutputText: any, setThinkingText: any, setTransHistory: (history: any[]) => void, fetchPrompt: (text: string) => Promise<string>) => {
    if (!apiKey) {
        setShowConfigModal(true);
        return;
    }
    if (!inputText) {
        alert('请输入需要翻译的文本');
        return;
    }
    setIsProcessing(true);
    setStatus('翻译中');
    setOutputText('');
    setThinkingText('');
    try {
        const prompt = await fetchPrompt(inputText);
        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [{ role: 'user', content: prompt }],
                stream: true
            })
        });

        if (!response.ok || !response.body) {
            const errorBody = await response.text();
            console.error('API Error Response:', errorBody);
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data.trim() === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta;
                        if (delta) {
                            if (delta.reasoning) {
                                if (delta.reasoning !== '\n'){
                                    setThinkingText((prev: string) => (prev + String(delta.reasoning)).replace(/\\n$/, '\n'));
                                }
                            } else if (delta.content) {
                                setOutputText((prev: string) => prev + delta.content);
                            }
                        } else if (parsed.error) {
                            console.error("API Error in stream:", parsed.error);
                            throw new Error(`API Error: ${parsed.error.message || 'Unknown error'}`);
                        }
                    } catch (error) {
                        console.error('Error parsing JSON data:', data, error);
                        setOutputText((prev: string) => prev + '\n[Error parsing response chunk]\n');
                    }
                }
            }
        }
        if (buffer.trim()) {
            console.log("Remaining buffer:", buffer);
        }

        setStatus('翻译完成');
    } catch (error: any) {
        console.error('Error:', error);
        setStatus('翻译出错，请重试');
        if (error instanceof Error) {
            setOutputText(`翻译出错: ${error.message}`);
            if (error.message.includes('401') || error.message.toLowerCase().includes('invalid key')) {
                setShowConfigModal(true);
            }
        } else {
            setOutputText('发生未知错误');
        }
    } finally {
        setIsProcessing(false);
    }
};

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

    const processText = async () => {
        if (outputText) {
            setTransHistory([...transHistory, { input: inputText, output: outputText, thinking: thinkingText }]);
        }
        await m_processText(apiKey, inputText, selectedModel, apiUrl, setShowConfigModal, setIsProcessing, setStatus, setOutputText, setThinkingText, setTransHistory, fetchPrompt);
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
        <Container fluid className="vh-90">
            <Navbar bg="light" expand="lg">
            <Container>
                    <Navbar.Brand>中翻英</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Nav.Link onClick={() => setShowConfigModal(true)}>设置</Nav.Link>
                    <Navbar.Collapse id="basic-navbar-nav">
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Row className="h-90">
                <Col md={3} className="bg-light p-3">
                    {/* Left Panel */}
                    <Nav defaultActiveKey="/home" className="flex-column">
                        <Nav.Link href="/home">Active</Nav.Link>
                        <Nav.Link eventKey="link-1">Link</Nav.Link>
                        <Nav.Link eventKey="link-2">Link</Nav.Link>
                        <Nav.Link eventKey="disabled" disabled>
                            Disabled
                        </Nav.Link>
                    </Nav>
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
