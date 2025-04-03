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
    onClose: () => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    apiKey: string;
    setApiKeyState: (value: string) => void;
    selectedModel: string;
    setSelectedModel: (value: string) => void;
}



const Config: React.FC<ConfigProps> = ({ onClose, showModal, setShowModal, apiKey, setApiKeyState, selectedModel, setSelectedModel }) => {

    const [tempApiKey, setTempApiKey] = useState(apiKey);
    const [tempModel, setTempModel] = useState(selectedModel);
    const [models, setModels] = useState<OpenRouterModel[]>([]);

    //assume user will paste api key
    useEffect(() => {
        if (tempApiKey && tempApiKey.length >= 10) {
            fetchAndFilterModels().then(setModels);
        }
    }, [tempApiKey]);

    
    const handleTempApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTempApiKey(event.target.value);
    };

    const handleTempModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (models.length > 0 && event.target.value !== '') {
            setTempModel(event.target.value);
        }
    };

    function saveAndClose(): void {
        if  (models.length > 0 && tempApiKey.length >= 10 && tempModel !== '') {
            setApiKeyState(tempApiKey);
            setSelectedModel(tempModel);
            setShowModal(false);
        }
    }

    return (
        <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title>设置密钥和模型</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <label htmlFor="apiKeyInput" className="form-label">请输入您的 OpenRouter API 密钥：</label>
                    <input type="text" className="form-control" id="apiKeyInput" value={tempApiKey} onChange={handleTempApiKeyChange} />
                    <div className="mt-2">
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary">获取 OpenRouter API 密钥</a>
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="modelSelect" className="form-label">选择模型:</label>
                    <select className="form-select" id="modelSelect" value={tempModel} onChange={handleTempModelChange} disabled={models.length === 0}>
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
                <Button variant="primary" onClick={onClose}>取消</Button>
                <Button variant="primary" onClick={saveAndClose} disabled={!tempApiKey || tempApiKey.length < 10}>保存</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Config;
