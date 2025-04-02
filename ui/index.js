import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Modal, Button } from 'react-bootstrap';

const App = () => {
    const [apiKey, setApiKey] = useState(localStorage.getItem('OPENROUTER_API_KEY') || '');
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('SELECTED_MODEL') || 'google/gemini-2.0-pro-exp-02-05:free');
    const [models, setModels] = useState([]);
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [thinkingText, setThinkingText] = useState('');
    const [status, setStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const samplePrompt = `
你是现代中国大陆人，是一个佛教徒,懂得专业佛教知识，懂得佛教专用的字和词句,使用现代用语       
在经过仔细思考后,对以下中文文本进行多层级排版，使其更加优美，并输入为Markdown格式。
要求：
1. 需要删除重复字，需要删除语气词,删除多余的空格
2. 不要加入新内容，不要改变原来的意思，不要进行精简，不要总结
3. 如果使用了错误的佛教用语，在字数不变的情况下才可以修正为正确的佛教用语，否则不要改变用语,但是可以改正错别字
4. 不要调整段落结构
5. 需要修正标点符号
6. 转换为简体中文，加入适当的标题、分段和强调

原文：
{text}

以Markdown格式输出优化后的文本。只输入优化后的文本，不要输出其他内容。不要做出解释，思考时尽量简洁扼要`;

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
            let filteredModels = data.data.filter(model =>
                model.name.toLowerCase().includes('free') &&
                !model.name.toLowerCase().includes('distill') &&
                !model.name.toLowerCase().includes('learnlm')
            ).filter(model =>
                model.name.toLowerCase().includes('pro') ||
                model.name.toLowerCase().includes('gemini pro') ||
                model.name.toLowerCase().includes('deepseek: r1') ||
                model.name.toLowerCase().includes('qwq')
            );
            setModels(filteredModels);
        } catch (error) {
            console.error('Error fetching/filtering models:', error);
            alert('Failed to fetch or filter models. Please check your API key and network connection.');
        }
    };

    const handleApiKeyChange = (event) => {
        setApiKey(event.target.value);
    };

    const handleModelChange = (event) => {
        setSelectedModel(event.target.value);
    };

    const saveApiKey = () => {
        if (apiKey) {
            localStorage.setItem('OPENROUTER_API_KEY', apiKey);
            localStorage.setItem('SELECTED_MODEL', selectedModel);
            setShowModal(false);
        } else {
            alert('请输入有效的API密钥');
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
                    'HTTP-Referer': window.location.origin,
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true
                })
            });
            if (!response.ok) throw new Error('API请求失败');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value);
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices[0].delta;
                            if (delta.reasoning) {
                                setThinkingText(prev => prev + delta.reasoning.replace(/\\n/g, '\n'));
                            } else if (delta.content) {
                                setOutputText(prev => prev + delta.content);
                            }
                        } catch (error) {
                            console.error('Error parsing JSON:', error);
                            setOutputText('Error parsing JSON response: ' + error.message);
                        }
                    }
                }
            }
            setStatus('处理完成');
        } catch (error) {
            console.error('Error:', error);
            setStatus('处理出错，请重试');
            if (error.message.includes('API')) {
                setOutputText('API请求失败: ' + error.message);
                setShowModal(true);
            } else {
                setOutputText('处理出错: ' + error.message);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (apiKey) {
            fetchAndFilterModels();
        }
    }, [apiKey]);

    useEffect(() => {
        if (!apiKey) {
            setShowModal(true);
        }
    }, []);

    return (
        <div className="container">
            <div className="card shadow-sm">
                <div className="card-body">
                    <h1 className="text-center mb-4">中文智能排版</h1>

                    <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
                        <Modal.Header closeButton>
                            <Modal.Title>设置密钥和模型</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3">
                                <label htmlFor="apiKeyInput" className="form-label">请输入您的 OpenRouter API 密钥：</label>
                                <input type="text" className="form-control" id="apiKeyInput" value={apiKey} onChange={handleApiKeyChange} onPaste={fetchAndFilterModels} />
                                <div className="mt-2">
                                    <a href="https://zhuanlan.zhihu.com/p/28203837581" target="_blank" className="text-primary">点击查看API获取教程 (二、OpenRouter国内使用教程)</a>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="modelSelect" className="form-label">选择模型:(推荐Google: Gemini Pro 2.0 Experimental (free))</label>
                                <select className="form-control" id="modelSelect" value={selectedModel} onChange={handleModelChange}>
                                    {models.map(model => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                </select>
                                <p className="text-muted">注意，模型选择会影响处理速度和质量，请根据需要选择合适的模型。</p>
                                <p className="text-muted">Deepseek r1是新秀</p>
                                <p className="text-muted">Qwen是阿里巴巴的通义千问,最新版为QwQ32B</p>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary" onClick={saveApiKey}>保存</Button>
                        </Modal.Footer>
                    </Modal>

                    <div className="mb-4">
                        <label htmlFor="inputText" className="form-label fw-bold">输入文本：</label>
                        <textarea className="form-control mb-2" id="inputText" rows="8" placeholder="请在此输入需要优化的中文文本..." value={inputText} onChange={(e) => setInputText(e.target.value)}></textarea>
                    </div>

                    <div className="d-flex justify-content-center gap-2 mb-4 flex-wrap">
                        <button onClick={processText} id="processBtn" className="btn btn-primary" disabled={isProcessing}>
                            <i className="bi bi-magic"></i> 自动优化
                        </button>
                        <button onClick={() => setShowModal(true)} className="btn btn-outline-primary">
                            <i className="bi bi-key"></i> 设置密钥和模型
                        </button>
                    </div>

                    <div id="status" className="text-center text-muted small mb-3">{status}</div>

                    <div>
                        <label htmlFor="outputText" className="form-label fw-bold">处理结果：</label>
                        <textarea className="form-control" id="outputText" rows="4" readOnly placeholder="优化后的文本将显示在这里..." value={outputText}></textarea>
                    </div>
                    <div className="mt-3">
                        <label htmlFor="thinkingText" className="form-label fw-bold">模型思考过程：</label>
                        <textarea className="form-control" id="thinkingText" rows="6" readOnly placeholder="模型的思考过程将显示在这里..." value={thinkingText}></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
