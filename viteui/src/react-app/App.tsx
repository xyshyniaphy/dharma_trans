// src/react-app/App.tsx

import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
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
    const [showModal, setShowModal] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
            setShowModal(true);
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
                    setShowModal(true);
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
            setShowModal(true);
        }
    }, [apiKey]);

    return (
        <div className="container">
            <div className="card shadow-sm">
                <div className="card-body">
                    <h1 className="text-center mb-4">中文智能排版</h1>

                    <Config
                        apiKey={apiKey}
                        setApiKey={setApiKey}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        models={models}
                        setModels={setModels}
                        showModal={showModal}
                        setShowModal={setShowModal}
                        fetchAndFilterModels={fetchAndFilterModels}
                    />

                    <div className="mb-4">
                        <label htmlFor="inputText" className="form-label fw-bold">输入文本：</label>
                        <textarea className="form-control mb-2" id="inputText" rows={8} placeholder="请在此输入需要优化的中文文本..." value={inputText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}></textarea>
                    </div>

                    <div className="d-flex justify-content-center gap-2 mb-4 flex-wrap">
                        <button onClick={processText} id="processBtn" className="btn btn-primary" disabled={isProcessing || !inputText}>
                            {isProcessing ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="bi bi-magic"></i>
                            )}
                            {isProcessing ? ' 处理中...' : ' 自动优化'}
                        </button>
                        <button onClick={() => setShowModal(true)} className="btn btn-outline-secondary">
                            <i className="bi bi-key"></i> 设置密钥和模型
                        </button>
                    </div>

                    <div id="status" className="text-center text-muted small mb-3">{status || ' '}</div>

                    <div className="mb-3">
                        <label htmlFor="outputText" className="form-label fw-bold">处理结果：</label>
                        <textarea className="form-control" id="outputText" rows={8} readOnly placeholder="优化后的文本将显示在这里..." value={outputText}></textarea>
                    </div>
                    <div className="mt-3">
                        <label htmlFor="thinkingText" className="form-label fw-bold">模型思考过程：</label>
                        <textarea className="form-control" id="thinkingText" rows={4} readOnly placeholder="模型的思考过程将显示在这里..." value={thinkingText}></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
