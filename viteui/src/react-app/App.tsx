// src/react-app/App.tsx

import React, { useState, useEffect } from 'react';
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
            alert('请输入需要处理的文本');
            return;
        }
        setIsProcessing(true);
        setStatus('正在处理中...');
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
                                    setThinkingText((prev: string) => prev + String(delta.reasoning).replace(/\\n/g, '\n'));
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

            setStatus('处理完成');
        } catch (error: any) {
            console.error('Error:', error);
            setStatus('处理出错，请重试');
            if (error instanceof Error) {
                setOutputText(`处理出错: ${error.message}`);
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

    return (
        <Container fluid className="d-flex justify-content-center align-items-center">

            {/* Config Modal */}
            <Config
                onClose={handleHideConfigModal}
                showModal={showConfigModal}
                apiKey={apiKey}
                setApiKeyState={setApiKeyState}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
            />
        

            <Stack gap={3} className="w-100">
                <Form.Group>
                    <Form.Label className="text-center fw-bold fs-1">中翻英</Form.Label>
                    <Form.Label className="fw-bold">输入文本：</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={8}
                        placeholder="请在此输入需要翻译的中文文本..."
                        value={inputText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                    />
                </Form.Group>

                
                    <Button
                        onClick={processText}
                        id="processBtn"
                        variant="primary"
                        disabled={isProcessing || !inputText}
                    >
                        {isProcessing ? (
                            <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                        ) : (
                            <i className="bi bi-magic"></i>
                        )}
                        {isProcessing ? ' 处理中...' : ' 翻译'}
                    </Button>
                    <Button onClick={() => setShowConfigModal(true)} variant="outline-secondary">
                        <i className="bi bi-key"></i> 设置密钥和模型
                    </Button>
               
                <div id="status" className="text-center text-muted small ">{status || ' '}</div>

                <Form.Group>
                    <Form.Label className="fw-bold">处理结果：</Form.Label>
                    <ReactMarkdown>
                        {outputText}
                    </ReactMarkdown>
                </Form.Group>
                {thinkingText && (
                    <Form.Group>
                        <Form.Label className="fw-bold">模型思考过程：</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            readOnly
                            placeholder="模型的思考过程将显示在这里..."
                            value={thinkingText}
                        />
                    </Form.Group>
                )}
            </Stack>
        </Container>
    );
};

export default App;
