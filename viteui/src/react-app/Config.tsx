// src/react-app/Config.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface OpenRouterModel {
    id: string;
    name: string;
}

const fetchAndFilterModels = async () => {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        const filteredModels = data.data.filter((model: any) => 
            model.id.includes('gpt') || model.id.includes('claude') || model.id.includes('gemini')
        );
        return filteredModels;
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
};

interface ConfigProps {
    setApiKey: (apiKey: string) => void;
    setSelectedModel: (model: string) => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
}

const Config: React.FC<ConfigProps> = ({ setApiKey, setSelectedModel, showModal, setShowModal }) => {
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [apiKey, setApiKeyState] = useState<string>(localStorage.getItem('OPENROUTER_API_KEY') || '');
    const [selectedModelState, setSelectedModelState] = useState<string>(localStorage.getItem('SELECTED_MODEL') || '');
    
    const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setApiKeyState(event.target.value);
        setApiKey(event.target.value);
    };

    const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModelState(event.target.value);
        setSelectedModel(event.target.value);
    };

    const saveApiKey = () => {
        if (apiKey) {
            localStorage.setItem('OPENROUTER_API_KEY', apiKey);
            localStorage.setItem('SELECTED_MODEL', selectedModelState);
            setShowModal(false);
            fetchAndFilterModels().then(setModels);
        } else {
            alert('请输入有效的API密钥');
        }
    };

    return (
        <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title>设置密钥和模型</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <label htmlFor="apiKeyInput" className="form-label">请输入您的 OpenRouter API 密钥：</label>
                    <input type="text" className="form-control" id="apiKeyInput" value={apiKey} onChange={handleApiKeyChange} />
                    <div className="mt-2">
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary">获取 OpenRouter API 密钥</a>
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="modelSelect" className="form-label">选择模型:</label>
                    <select className="form-select" id="modelSelect" value={selectedModelState} onChange={handleModelChange} disabled={models.length === 0}>
                        {models.length === 0 && <option>请先输入有效API Key</option>}
                        {models.map((model: OpenRouterModel) => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                    <div className="form-text">
                        推荐: Google Gemini Pro (free), Mistral 7B Instruct (free), Qwen Chat (free). 模型影响速度和质量。
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => setShowModal(false)}>取消</Button>
                <Button variant="primary" onClick={saveApiKey} disabled={!apiKey}>保存</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Config;
