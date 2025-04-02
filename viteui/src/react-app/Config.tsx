// src/react-app/Config.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface OpenRouterModel {
    id: string;
    name: string;
}

interface ConfigProps {
    apiKey: string;
    setApiKey: (apiKey: string) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    models: OpenRouterModel[];
    setModels: (models: OpenRouterModel[]) => void;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    fetchAndFilterModels: () => Promise<void>;
}

const Config: React.FC<ConfigProps> = ({ apiKey, setApiKey, selectedModel, setSelectedModel, models, setModels, showModal, setShowModal, fetchAndFilterModels }) => {
    const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(event.target.value);
    };

    const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(event.target.value);
    };

    const saveApiKey = () => {
        if (apiKey) {
            localStorage.setItem('OPENROUTER_API_KEY', apiKey);
            localStorage.setItem('SELECTED_MODEL', selectedModel);
            setShowModal(false);
            fetchAndFilterModels();
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
                    <select className="form-select" id="modelSelect" value={selectedModel} onChange={handleModelChange} disabled={models.length === 0}>
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
                <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                <Button variant="primary" onClick={saveApiKey} disabled={!apiKey}>保存</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Config;
