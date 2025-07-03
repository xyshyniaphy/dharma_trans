// src/react-app/Config.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

import DictViewer from './DictViewer'; // Import the new component
import { fetchAndFilterModels } from './hooks/filterModels';
import { useModelsState } from './hooks/modelsHook';
import { useDTConfig } from './hooks/configHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';

interface ConfigProps {
    clearTopics: () => Promise<void>;
}

//models list is static, no need to reload
let loadedModels = false;

const Config: React.FC<ConfigProps> = ({ clearTopics }) => {

    const { loaded,config, updateConfig } = useDTConfig();
    // Destructure selectedModels instead of selectedModel
    const { explain, apiKey  } = config;

    const [tempApiKey, setTempApiKey] = useState(apiKey);
    const [, setModels] = useModelsState(); // setModels is used to load the models list
    const [showDictViewer, setShowDictViewer] = useState(false); // State for DictViewer modal

    const [{ showConfigModal }, updateStatus] = useTranslatorStatus();

  //do not add dependency to useEffect
    useEffect(() => {
        if(!loaded) return;
        if (!apiKey) {
            updateStatus({ showConfigModal: true }); 
        }
    }, [loaded]);


    const handleHideConfigModal = () => {
        updateStatus({ showConfigModal: false });
    };

    // const { transHistory } = useTransHistory();

    const handleClearHistory = async () => {
        // Confirm with the user before clearing history (in Chinese)
        if (window.confirm("确定要清除历史记录吗？")) {
            try {
                await clearTopics();
            } catch (error) {
                console.error("Error clearing history:", error);
            }
        }
    };

    // const handleExportHistory = () => {
    //     const json = JSON.stringify(transHistory, null, 2);
    //     const blob = new Blob([json], { type: 'application/json' });
    //     const url = URL.createObjectURL(blob);
        
    //     if (window.confirm('Do you want to save the translation history as JSON?')) {
    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.download = 'translation_history.json';
    //         link.click();
    //     }
        
    //     URL.revokeObjectURL(url);
    // };

    // const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0];
    //     if (file) {
    //         const reader = new FileReader();
    //         reader.onload = (e) => {
    //             try {
    //                 const importedHistory = JSON.parse(e.target?.result as string) as Translation[];
    //                 console.log('Imported history:', importedHistory.length)
    //             } catch (error) {
    //                 console.error('Error parsing JSON:', error);
    //             }
    //         };
    //         reader.readAsText(file);
    //     }
    // };

  //do not add dependency to useEffect
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
        console.log('Temp API Key:', newKey);
    };

    function saveAndClose(): void {
        // API key is required to be at least 10 characters long.
        if (tempApiKey.length >= 10) {
            console.log('Saving API Key:', tempApiKey);
            // Only need to save apiKey if it changed, selectedModels is updated directly by ModelSelector
            if (tempApiKey !== apiKey) {
                updateConfig({ apiKey: tempApiKey });
            }
            handleHideConfigModal();
        } else {
            // Optionally provide feedback if save conditions aren't met
            console.warn("Save conditions not met. API Key must be valid.");
            alert("Please ensure you have entered a valid API key.");
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
                    variant="outline-primary" 
                    onClick={() => setShowDictViewer(true)} 
                    className="ms-3 p-0 align-baseline" // Adjust styling as needed
                >
                    查看词典
                </Button>
              
            </Modal.Body>
            <Modal.Footer>
                
                <Button variant="outline-primary" onClick={handleClearHistory} className="me-2">清除历史</Button>
                {/* <Button variant="outline-primary" onClick={handleExportHistory} className="me-2">导出历史</Button> */}
                {/* <Button  variant="outline-primary" as="label" htmlFor="import-history" className="me-2">
                    导入历史
                    <input type="file" id="import-history" accept=".json" onChange={handleImportHistory} hidden />
                </Button> */}
                <Button variant="outline-warning" onClick={handleHideConfigModal}>取消</Button>
                {/* Update save button disabled condition to only check for API key */}
                <Button variant="success" onClick={saveAndClose} disabled={!tempApiKey || tempApiKey.length < 10}>保存</Button>

            </Modal.Footer>

            {/* Render DictViewer Modal */}
            <DictViewer show={showDictViewer} onHide={() => setShowDictViewer(false)} />
        </Modal>
    );
};

export default Config;
