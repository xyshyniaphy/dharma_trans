// src/react-app/Config.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

import { Translation } from './interface/translation_interface';
import { fetchAndFilterModels, OpenRouterModel } from './hooks/filterModels'; // Keep OpenRouterModel if needed elsewhere, otherwise remove
import { useModelsState } from './hooks/modelsHook';
import { useDTConfig } from './hooks/configHook';
// import { useCurrentModel } from './hooks/currentModelHook'; // No longer needed here
import { useTransHistory } from './hooks/transHistoryHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import ModelSelector from './ModelSelector'; // Import the new component

interface ConfigProps {
}
let loadedModels = false;

const Config: React.FC<ConfigProps> = () => {

    const { config, updateConfig } = useDTConfig();
    // Destructure selectedModels instead of selectedModel
    const { explain, apiKey, selectedModels, loaded } = config;
    // const [currentModel, setCurrentModel] = useCurrentModel(); // Removed

    const [tempApiKey, setTempApiKey] = useState(apiKey);
    // Replace tempModel state with tempSelectedModelIds
    const [tempSelectedModelIds, setTempSelectedModelIds] = useState<string[]>(selectedModels || []);
    const [models, setModels] = useModelsState();

    const [{ showConfigModal }, updateStatus] = useTranslatorStatus();

    useEffect(() => {
        if(!loaded) return;
        if (!apiKey) {
            updateStatus({ showConfigModal: true }); 
        }
    }, [apiKey, loaded]);


    const handleHideConfigModal = () => {
        // Reset temp state on cancel/hide if desired, or keep it to persist changes until save
        // setTempApiKey(apiKey);
        // setTempSelectedModelIds(selectedModels || []);
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

    // Remove useEffect related to single currentModel update
    // useEffect(() => { ... });

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

    // Remove handleTempModelChange for single select
    // const handleTempModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => { ... };

    // Add handler for multi-select change
    const handleTempModelsChange = (selectedIds: string[]) => {
        setTempSelectedModelIds(selectedIds);
        console.log('Selected model IDs:', selectedIds);
    };


    function saveAndClose(): void {
        // Update condition to check tempSelectedModelIds length
        if (models.length > 0 && tempApiKey.length >= 10 && tempSelectedModelIds.length > 0) {
            console.log('Saving API Key:', tempApiKey);
            console.log('Saving selected model IDs:', tempSelectedModelIds);
            // Save selectedModels array instead of selectedModel string
            updateConfig({ apiKey: tempApiKey, selectedModels: tempSelectedModelIds });
            handleHideConfigModal();
        } else {
            // Optionally provide feedback if save conditions aren't met
            console.warn("Save conditions not met. API Key and at least one model must be selected.");
            alert("Please ensure you have entered a valid API key and selected at least one model.");
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
                            models={models}
                            selectedModelIds={tempSelectedModelIds}
                            onChange={handleTempModelsChange}
                            disabled={models.length === 0 || !tempApiKey}
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
              
            </Modal.Body>
            <Modal.Footer>
                
                <Button variant="outline-primary" onClick={handleClearHistory} className="me-2">清除历史</Button>
                <Button variant="outline-primary" onClick={handleExportHistory} className="me-2">导出历史</Button>
                <Button variant="outline-primary" as="label" htmlFor="import-history" className="me-2">
                    导入历史
                    <input type="file" id="import-history" accept=".json" onChange={handleImportHistory} hidden />
                </Button>
                <Button variant="outline-warning" onClick={handleHideConfigModal}>取消</Button>
                {/* Update save button disabled condition */}
                <Button variant="outline-success" onClick={saveAndClose} disabled={!tempApiKey || tempApiKey.length < 10 || tempSelectedModelIds.length === 0}>保存</Button>

            </Modal.Footer>
        </Modal>
    );
};

export default Config;
