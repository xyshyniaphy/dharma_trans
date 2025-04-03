// src/react-app/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Spinner, Container, Stack } from 'react-bootstrap';
import { useLocalStorage } from './hooks/useLocalStorage';
import Config from './Config';
import ReactMarkdown from 'react-markdown';

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

const App: React.FC = () => {
    const [apiKey, setApiKeyState] = useLocalStorage<string>('OPENROUTER_API_KEY', '');
    const [selectedModel, setSelectedModel] = useLocalStorage<string>('SELECTED_MODEL', 'google/gemini-2.5-pro-exp-03-25:free');
    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [thinkingText, setThinkingText] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showConfigModal, setShowConfigModal] = useState<boolean>(false); // New state for Config modal


    const processText = async () => {
        if (!apiKey) {
            setShowConfigModal(true); // Open Config modal if no API key
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
                    setShowConfigModal(true); // Open Config modal on 401 error
                }
            } else {
                setOutputText('发生未知错误');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleHideConfigModal = () => {
        console.log('Hiding config modal');
        setShowConfigModal(false);
    };

    useEffect(() => {
        if (!apiKey) {
            setShowConfigModal(true); // Open Config modal if no API key on initial load
        }
    }, [apiKey]);

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textAreaRef.current) {
        textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
      }
    }, [thinkingText]);

    return (
        <Container fluid className="d-flex flex-column justify-content-center align-items-center vh-90">

            {/* Config Modal */}
            <Config
                onClose={handleHideConfigModal}
                showModal={showConfigModal}
                apiKey={apiKey}
                setApiKeyState={setApiKeyState}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
            />
        
            <Stack gap={3} className="w-100 h-90 overflow-auto p-3">
                <Form.Group className="flex-grow-1">
                    <Form.Label className="text-center fw-bold fs-1">中翻英</Form.Label>
                    <Form.Label className="fw-bold">输入文本：</Form.Label>
                    <Form.Control
                        as="textarea"
                        readOnly={isProcessing}
                        className="h-90"
                        placeholder="请在此输入需要翻译的中文文本..."
                        value={inputText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                    />
                </Form.Group>

                <div className="d-flex gap-2 w-100">
                    <Button
                        onClick={processText}
                        id="processBtn"
                        variant="primary"
                        disabled={isProcessing || !inputText}
                        className="flex-grow-1"
                    >
                        {isProcessing ? status : ' 翻译'}
                    </Button>
                    <Button onClick={() => setShowConfigModal(true)} variant="outline-secondary" style={{ width: '100px' }}>
                        设置
                    </Button>
                </div>

                {thinkingText && (
                    <Form.Group className="flex-grow-1">
                        <Form.Label className="fw-bold">模型思考过程：</Form.Label>
                        <Form.Control
                            ref={textAreaRef}
                            as="textarea"
                            className="h-90"
                            readOnly
                            placeholder="模型的思考过程将显示在这里..."
                            value={thinkingText}
                        />
                    </Form.Group>
                )}

                {isProcessing ? null : (
                    <Form.Group className="flex-grow-1">
                        <Form.Label className="fw-bold">翻译结果：</Form.Label>
                        <div className="h-90 overflow-auto">
                            <ReactMarkdown>
                                {outputText}
                            </ReactMarkdown>
                        </div>
                    </Form.Group>
                )}
                
            </Stack>
        </Container>
    );
};

export default App;
