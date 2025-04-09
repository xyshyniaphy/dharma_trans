/**
 * Input Component - Handles text input, processing, and display of translation results
 * Features:
 * - Text input area for user to enter text
 * - Processing button to trigger translation
 * - Display areas for model thinking process and translation results
 * - History management with delete functionality
 */
import React, { useState } from 'react';
import { Form, Stack, Dropdown } from 'react-bootstrap';
import { OpenRouterModel } from './hooks/filterModels';

import { useCurrentModel } from './hooks/currentModelHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { TranslateItems } from './TranslateItems';
import { useTransHistory } from './hooks/transHistoryHook';
import { Translation } from './translation_interface';
import { useModelsState } from './hooks/modelsHook';

// Props interface for the Input component
interface InputProps {
   
}

const Input: React.FC<InputProps> = ({
}) => {
    
    const [{isProcessing}, updateStatus] = useTranslatorStatus();
    const [currentModel, setCurrentModel] = useCurrentModel();

    const [inputText, setInputText] = useState<string>('');

    //todo : convert to use recoil
    const [transHistory, _setTransHistory] = useTransHistory();
    const [_trans, setTranslate] = useCurrentTranslate();

    
    const [models, _setModels] = useModelsState();

    function processText(_event: any): void {
        updateStatus({ isProcessing: true, status: '开始翻译' })
        setTranslate({
            input: inputText,
            output: '',
            thinking: '',
            timestamp: Date.now(),
            modelName: currentModel?.name || '',
            price: 0,
            topicId: '',
            translateId: Date.now().toString(),
            modelId: currentModel?.id || ''
        });
    }

    return (
        <Stack gap={3} className="h-90 overflow-auto">
            {/* Input text area */}
            <Form.Group className="flex-grow-1">
                <Form.Label className="fw-bold">输入文本：</Form.Label>
                <Form.Control
                    as="textarea"
                    className="h-90"
                    placeholder="请在此输入需要翻译的文本..."
                    value={inputText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                />
            </Form.Group>

            {/* Processing button */}
            <div className="d-flex gap-2 w-100">
                <Dropdown>
                    <Dropdown.Toggle 
                        variant="primary" 
                        id="processBtn" 
                        disabled={isProcessing || !inputText}
                        className="flex-grow-1"
                        onClick={processText}
                    >
                        {isProcessing ? '翻译中' : ' 翻译 (' + currentModel?.name + ')'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {models.length === 0 ? (
                            <Dropdown.Item disabled>请先输入有效API Key</Dropdown.Item>
                        ) : (
                            models.map((model: OpenRouterModel) => (
                                <Dropdown.Item 
                                    key={model.name} 
                                    onClick={() => setCurrentModel(model)}
                                >
                                    {model.name}
                                </Dropdown.Item>
                            ))
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            <TranslateItems translations={transHistory} />
        </Stack>
    );
};

export default Input;
