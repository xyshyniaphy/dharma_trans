/**
 * Input Component - Handles text input, processing, and display of translation results
 * Features:
 * - Text input area for user to enter text
 * - Processing button to trigger translation
 * - Display areas for model thinking process and translation results
 * - History management with delete functionality
 */
import React, { useState } from 'react';
import { Form, Stack, Button } from 'react-bootstrap'; // Removed Dropdown
import { useModelsState } from './hooks/modelsHook';
import { TranslateItems } from './TranslateItems';
import ModelSelector from './ModelSelector'; // Import ModelSelector
import { useDTConfig } from './hooks/configHook';
import { useTranslatorExe } from './hooks/translatorExeHook';
import { Translation } from './interface/translation_interface';
import { OpenRouterModel } from './hooks/filterModels'; // Import OpenRouterModel
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
// Props interface for the Input component
interface InputProps {
    addTranslationToTopic: (translation: Translation) => Promise<void>;
    deleteTranslation: (translationId: string) => Promise<void>;
}

const Input: React.FC<InputProps> = ({
    addTranslationToTopic,
    deleteTranslation
}) => {
    const { startTranslate } = useTranslatorExe({ addTranslationToTopic });
    const { config } = useDTConfig();

    const [inputText, setInputText] = useState<string>('');
    const [models] = useModelsState(); // Get the full list of available models

    const [{ }, updateStatus] = useTranslatorStatus();

    async function processText(_event: any): Promise<void> {
        // Use the global config state directly
        if (!config.selectedModels || config.selectedModels.length === 0) {
            alert("Please select at least one model in settings to use for translation.");
            return;
        }
        if (!inputText) return;

        const textToTranslate = inputText; // Store input before clearing
        setInputText(''); // Clear input field immediately
        
        updateStatus({ isProcessing: true, status: '翻译中' });

        try {
            let transNo=0;
            const transBatchId = `${Date.now()}_${(Math.random() * 1000).toFixed(0)}`;
            // Loop through all selected models from the global config
            for (let i = 0; i < config.selectedModels.length; i++) {
                const modelIdToUse = config.selectedModels[i];
                const modelToUse = models.find((m: OpenRouterModel) => m.id === modelIdToUse);

                if (!modelToUse) {
                    console.error(`Selected model ID ${modelIdToUse} not found in available models.`);
                    continue; // Skip this model and continue with the next
                }

                // Generate a unique ID for each translation instance
                const uniqueTranslateId = `${transBatchId}_${transNo}`;
                console.log('Starting translation for model:', modelToUse.name, 'ID:', modelToUse.id);

                await startTranslate({
                    input: textToTranslate, // Use the stored input text
                    output: '',
                    thinking: '',
                    timestamp: Date.now(),
                    modelName: modelToUse.name, // Use name or ID
                    price: 0, // Price calculation might need adjustment
                    translateId: uniqueTranslateId, // Use the unique ID
                    modelId: modelToUse.id // Use the current model's ID
                }, modelToUse); // Pass the modelId as the second argument
                transNo++;
            }
        }finally{
            updateStatus({ isProcessing: false, status: '' });
        }
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
                    maxLength={1024}
                />
            </Form.Group>

            {/* Processing button and ModelSelector */}
            {/* Use d-flex for row layout, InputGroup might interfere with ModelSelector's dropdown */}
            <div className="d-flex gap-2 w-100">
                 <Button
                    variant="primary"
                    // Disable if no input OR no model is selected in the global config state
                    disabled={!inputText || !config.selectedModels || config.selectedModels.length === 0}
                    onClick={processText}
                    className="flex-grow-1" // Let button take available space
                 >
                    翻译
                </Button>
                {/* Use ModelSelector, passing only the configured models */}
                <div style={{ minWidth: '150px' }}> {/* Wrapper to control width if needed */}
                    <ModelSelector />
                </div>
            </div>
            <TranslateItems deleteTranslation={deleteTranslation} />
        </Stack>
    );
};

export default Input;
