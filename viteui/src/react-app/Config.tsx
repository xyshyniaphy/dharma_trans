// src/react-app/Config.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Stack } from 'react-bootstrap'; // Added Stack

import { Translation } from './interface/translation_interface';
import DictViewer from './DictViewer'; // Import the new component
import { fetchAndFilterModels } from './hooks/filterModels';
import { useModelsState } from './hooks/modelsHook';
import { useDTConfig } from './hooks/configHook';
import { useTransHistory } from './hooks/transHistoryHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import ModelSelector from './ModelSelector'; // Import the new component

interface ConfigProps {
}
let loadedModels = false;

const Config: React.FC<ConfigProps> = () => {

    const { config, updateConfig } = useDTConfig();
    // Destructure selectedModels instead of selectedModel
    const { explain, apiKey, loaded } = config;

    const [tempApiKey, setTempApiKey] = useState(apiKey);
    const [models, setModels] = useModelsState(); // Keep for checking if models are loaded for save/disable logic
    const [showDictViewer, setShowDictViewer] = useState(false); // State for DictViewer modal

    const [{ showConfigModal }, updateStatus] = useTranslatorStatus();

    useEffect(() => {
        if(!loaded) return;
        if (!apiKey) {
            updateStatus({ showConfigModal: true }); 
        }
    }, [apiKey, loaded]);


    const handleHideConfigModal = () => {
        updateStatus({ showConfigModal: false });
    };

    const { transHistory } = useTransHistory();

    const handleClearHistory = () => {
        //setTransHistory([]);
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
                    console.log('Imported history:', importedHistory.length)
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    //assume user will paste api key
    useEffect(() => {
        if(loadedModels) return;
        loadedModels=true;
        fetchAndFilterModels().then(setModels);
    }, []);

    const handleTempApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newKey = event.target.value;
        setTempApiKey(newKey);
        // Reset models if API key changes significantly, prompting a re-fetch potentially
         if (models.length > 0 && newKey !== apiKey) {
              setModels([]);
              loadedModels = false; // Allow re-fetching models
              // Assuming fetchAndFilterModels reads the key from config or env
              fetchAndFilterModels().then(setModels).catch(err => console.error("Failed to fetch models with new key:", err));
         } else if (!loadedModels && newKey.length >= 10) {
              // Fetch models if not loaded and key seems valid
              loadedModels = true;
               // Assuming fetchAndFilterModels reads the key from config or env
              fetchAndFilterModels().then(setModels).catch(err => console.error("Failed to fetch models:", err));
         }
         console.log('Temp API Key:', newKey);
    };

    function saveAndClose(): void {
        // Update condition to check config.selectedModels length directly
        // Also ensure models have loaded and API key is present
        if (models.length > 0 && tempApiKey.length >= 10 && config.selectedModels && config.selectedModels.length > 0) {
            console.log('Saving API Key:', tempApiKey);
            console.log('Saving selected model IDs from config:', config.selectedModels);
            // Only need to save apiKey if it changed, selectedModels is updated directly by ModelSelector
            if (tempApiKey !== apiKey) {
                updateConfig({ apiKey: tempApiKey });
            }
            // updateConfig({ apiKey: tempApiKey, selectedModels: config.selectedModels }); // selectedModels already updated
            handleHideConfigModal();
        } else {
            // Optionally provide feedback if save conditions aren't met
            console.warn("Save conditions not met. API Key and at least one model must be selected (check config).");
            alert("Please ensure you have entered a valid API key and selected at least one model using the dropdown.");
        }
    }
    if (!showConfigModal) return null;

    return (
        <Modal show={showConfigModal} onHide={handleHideConfigModal} >
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
                        <Form.Label htmlFor="model-selector-dropdown">选择模型 (可多选):</Form.Label>
                        {/* Replace Form.Select with ModelSelector */}
                        <ModelSelector
                            // selectedModelIds={tempSelectedModelIds} // Removed prop
                            // onChange={handleTempModelsChange} // Removed prop
                        />
                        {/* Remove single model details display */}
                        {/* <br/> ... */}
                        <br/>
                        <Form.Text>
                            推荐: DeepSeek V3 , Qwen:QWQ. 模型影响速度和质量。选择多个模型将在翻译时轮流使用。
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
                {/* Add button to show Dictionary Viewer */}
                <Button 
                    variant="link" 
                    onClick={() => setShowDictViewer(true)} 
                    className="ms-3 p-0 align-baseline" // Adjust styling as needed
                >
                    查看词典 (View Dictionary)
                </Button>
              
            </Modal.Body>
            <Modal.Footer>
                
                <Button variant="outline-primary" onClick={handleClearHistory} className="me-2">清除历史</Button>
                <Button variant="outline-primary" onClick={handleExportHistory} className="me-2">导出历史</Button>
                <Button variant="outline-primary" as="label" htmlFor="import-history" className="me-2">
                    导入历史
                    <input type="file" id="import-history" accept=".json" onChange={handleImportHistory} hidden />
                </Button>
                <Button variant="outline-warning" onClick={handleHideConfigModal}>取消</Button>
                {/* Update save button disabled condition to check config.selectedModels */}
                <Button variant="outline-success" onClick={saveAndClose} disabled={!tempApiKey || tempApiKey.length < 10 || !config.selectedModels || config.selectedModels.length === 0}>保存</Button>

            </Modal.Footer>

            {/* Render DictViewer Modal */}
            <DictViewer show={showDictViewer} onHide={() => setShowDictViewer(false)} />
        </Modal>
    );
};

export default Config;
