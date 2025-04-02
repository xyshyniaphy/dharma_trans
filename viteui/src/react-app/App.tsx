// src/react-app/App.tsx

import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Spinner, Card, Container, Stack, Row, Col } from 'react-bootstrap';
import Config from './Config';

interface OpenRouterModel {
    id: string;
    name: string;
}

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem('OPENROUTER_API_KEY') || '');
    const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('SELECTED_MODEL') || 'google/gemini-2.0-pro-exp-02-05:free');
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');
    const [thinkingText, setThinkingText] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showConfigModal, setShowConfigModal] = useState<boolean>(false); // New state for Config modal

    const samplePrompt = `
你是一个精通简体中文的专业翻译。
仔细思考后,对以下中文文本进行排版，使其更加优美，并输入为Markdown格式。
要求：
1. 删除重复字词和语气词，删除多余空格。
2. 不添加新内容，不改变原意，不精简，不总结。
3. 正确使用标点符号。
4. 保持段落结构不变。
5. 输出简体中文。

原文：
{text}

请以Markdown格式输出优化后的文本。只输出优化后的文本，不要包含其他说明或解释。思考过程尽量简洁。`;

    const fetchAndFilterModels = async () => {
        if (!apiKey) return;
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            const allModels = data.data as OpenRouterModel[];

            let filteredModels = allModels.filter(model =>
                model.name?.toLowerCase().includes('free') &&
                !model.name?.toLowerCase().includes('distill') &&
                !model.name?.toLowerCase().includes('learnlm')
            ).filter(model =>
                model.name?.toLowerCase().includes('pro') ||
                model.name?.toLowerCase().includes('gemini pro') ||
                model.name?.toLowerCase().includes('deepseek: r1') ||
                model.name?.toLowerCase().includes('qwq')
            );
            setModels(filteredModels);
        } catch (error) {
            console.error('Error fetching/filtering models:', error);
            alert('Failed to fetch or filter models. Please check your API key and network connection.');
        }
    };

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
            const prompt = samplePrompt.replace('{text}', inputText);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

    useEffect(() => {
        if (apiKey) {
            fetchAndFilterModels();
        } else {
            setShowConfigModal(true); // Open Config modal if no API key on initial load
        }
    }, [apiKey]);

    return (
        <Container className="d-flex justify-content-center align-items-center xxl-1">
                    <h1 className="text-center">中翻英</h1>

                    {/* Config Modal */}
                    <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} backdrop="static" keyboard={false}>
                        <Config
                            apiKey={apiKey}
                            setApiKey={setApiKey}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            models={models}
                            setModels={setModels}
                            showModal={showConfigModal}
                            setShowModal={setShowConfigModal}
                            fetchAndFilterModels={fetchAndFilterModels}
                        />
                    </Modal>

                    <Stack >
                        <Form.Group>
                            <Form.Label className="fw-bold">输入文本：</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={8}
                                placeholder="请在此输入需要优化的中文文本..."
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
                                {isProcessing ? ' 处理中...' : ' 自动优化'}
                            </Button>
                            <Button onClick={() => setShowConfigModal(true)} variant="outline-secondary">
                                <i className="bi bi-key"></i> 设置密钥和模型
                            </Button>
                       
                        <div id="status" className="text-center text-muted small ">{status || ' '}</div>

                        <Form.Group>
                            <Form.Label className="fw-bold">处理结果：</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={8}
                                readOnly
                                placeholder="优化后的文本将显示在这里..."
                                value={outputText}
                            />
                        </Form.Group>
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
                    </Stack>
        </Container>
    );
};

export default App;
