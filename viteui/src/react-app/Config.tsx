// src/react-app/Config.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

import { Translation } from './interface/translation_interface';
import { fetchAndFilterModels, OpenRouterModel } from './hooks/filterModels';
import { useModelsState } from './hooks/modelsHook';
import { useDTConfig } from './hooks/configHook';
import { useCurrentModel } from './hooks/currentModelHook';

interface ConfigProps {
    onClose: () => void;
    showModal: boolean;
    transHistory: Translation[];
    setTransHistory: (value: Translation[]) => void;
}

const Config: React.FC<ConfigProps> = ({ onClose, showModal, transHistory, setTransHistory }) => {

    const { config, updateConfig } = useDTConfig();
    const { explain, apiKey, selectedModel } = config;
    const [currentModel, setCurrentModel] = useCurrentModel();

    const [tempApiKey, setTempApiKey] = useState(apiKey);
    const [tempModel, setTempModel] = useState(selectedModel);
    const [models, setModels] = useModelsState();

    const handleClearHistory = () => {
        setTransHistory([]);
    };

    const handleExportHistory = () => {
        const json = JSON.stringify(transHistory, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        if (window.confirm('Do you want to save the translation history as JSON?')) {
            const link = document.createElement('a');
            link.href = url;
            link.download = 'translation_history.json';
            link.click();
        }
        
        URL.revokeObjectURL(url);
    };

    const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedHistory = JSON.parse(e.target?.result as string) as Translation[];
                    const newHistory = [...transHistory, ...importedHistory];
                    setTransHistory(newHistory);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    //assume user will paste api key
    useEffect(() => {
        if(models.length > 0) return;
        if (tempApiKey && tempApiKey.length >= 10) {
            fetchAndFilterModels().then(setModels);
        }
    }, [tempApiKey]);

    useEffect(() => {
        if (tempModel && models.length > 0) {
            const foundModel = models.find(model => model.id === tempModel);
            if (foundModel) {
                setCurrentModel(foundModel);
            }
        }
    }, [tempModel, models]);
    
    const handleTempApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTempApiKey(event.target.value);
        if(models.length > 0)setModels([]);
        console.log('Temp API Key:', event.target.value);
    };

    const handleTempModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if (models.length > 0 && event.target.value !== '') {
            setTempModel(event.target.value);
            console.log('Selected model:', event.target.value);
        }
    };

    function saveAndClose(): void {
        if  (models.length > 0 && tempApiKey.length >= 10 && tempModel !== '') {
            console.log('Saving API Key:', tempApiKey);
            console.log('Saving model:', tempModel);
            updateConfig({ apiKey: tempApiKey, selectedModel: tempModel });
            onClose();
        }
    }
    if(!showModal) return null;

    return (
        <Modal show={showModal} onHide={onClose} >
            <Modal.Header closeButton>
                <Modal.Title>设置密钥和模型</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="apiKeyInput">请输入您的 OpenRouter API 密钥：</Form.Label>
                        <Form.Control type="text" id="apiKeyInput" value={tempApiKey} onChange={handleTempApiKeyChange} />
                        <Button variant="link" href="https://zhuanlan.zhihu.com/p/28203837581" target="_blank" rel="noopener noreferrer" className="text-primary">获取 OpenRouter API 密钥</Button>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="modelSelect">选择模型:</Form.Label>
                        <Form.Select id="modelSelect" value={tempModel} onChange={handleTempModelChange} disabled={models.length === 0}>
                            {models.length === 0 && <option>请先输入有效API Key</option>}
                            {models.map((model: OpenRouterModel) => (
                                <option key={model.name} value={model.id}>{model.name}</option>
                            ))}
                        </Form.Select>
                        <br/>
                        {currentModel? <Form.Text>
                            {"价格 : "+ currentModel?.pricing.prompt || ""}
                        </Form.Text>:null}
                        <br/>
                        {currentModel? <Form.Text>
                            {"模型介绍 : "+ currentModel?.description || ""}
                        </Form.Text>:null}
                       
                        <br/>
                        <Form.Text>
                            推荐: DeepSeek V3 , Qwen:QWQ. 模型影响速度和质量。
                        </Form.Text>
                    </Form.Group>
                </Form>
                <br/>
                <Form.Check 
                    type="checkbox"
                    label="对翻译进行解释"
                    checked={explain}
                    onChange={(e) => {
                        updateConfig({ explain: e.target.checked });
                    }}
                    className="ms-3"
                />
              
            </Modal.Body>
            <Modal.Footer>
                
                <Button variant="outline-primary" onClick={handleClearHistory} className="me-2">清除历史</Button>
                <Button variant="outline-primary" onClick={handleExportHistory} className="me-2">导出历史</Button>
                <Button variant="outline-primary" as="label" htmlFor="import-history" className="me-2">
                    导入历史
                    <input type="file" id="import-history" accept=".json" onChange={handleImportHistory} hidden />
                </Button>
                <Button variant="outline-warning" onClick={onClose}>取消</Button>
                <Button variant="outline-success"  onClick={saveAndClose} disabled={!tempApiKey || tempApiKey.length < 10}>保存</Button>
                
            </Modal.Footer>
        </Modal>
    );
};

export default Config;
