/**
 * Input Component - Handles text input, processing, and display of translation results
 * Features:
 * - Text input area for user to enter text
 * - Processing button to trigger translation
 * - Display areas for model thinking process and translation results
 * - History management with delete functionality
 */
import React, { useState, useEffect } from 'react';
import { Form, Stack, Button, InputGroup } from 'react-bootstrap'; // Removed Dropdown
// import { useCurrentModel } from './hooks/currentModelHook'; // No longer needed here
import { useModelsState } from './hooks/modelsHook';
import { TranslateItems } from './TranslateItems';
import ModelSelector from './ModelSelector'; // Import ModelSelector
import { useDTConfig } from './hooks/configHook';
import { useTranslatorExe } from './hooks/translatorExeHook';
import { Translation } from './interface/translation_interface';
import { OpenRouterModel } from './hooks/filterModels'; // Import OpenRouterModel

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
    const { selectedModels = [] } = config; // Default to empty array

    const [inputText, setInputText] = useState<string>('');
    const [models] = useModelsState(); // Get the full list of available models

    // Remove local state for selected models, rely on global config.selectedModels
    // const [modelsSelectedForTranslate, setModelsSelectedForTranslate] = useState<string[]>([]);

    // Get only the models configured in settings from the full list
    // Note: This filtering might still be useful for disabling the selector if no models are configured
    const configuredModels = models.filter((m: OpenRouterModel) => selectedModels.includes(m.id));

    // Remove effect that managed local selection state
    // useEffect(() => { ... }, [selectedModels]);


    function processText(_event: any): void {
        // Use the global config state directly
        if (!config.selectedModels || config.selectedModels.length === 0) {
            alert("Please select at least one model in settings to use for translation.");
            return;
        }
        if (!inputText) return;

        // --- Logic to select a model for this translation ---
        // Simple approach: use the first model from the global config selection.
        const modelIdToUse = config.selectedModels[0];
        const modelToUse = models.find((m: OpenRouterModel) => m.id === modelIdToUse);
        // --- End model selection logic ---


        if (!modelToUse) {
            console.error(`Selected model ID ${modelIdToUse} not found in available models.`);
            alert(`Error: Selected model ${modelIdToUse} not found. Please check settings or select another model.`);
            return;
        }

        setInputText(''); // Clear input after starting
        startTranslate({
            input: inputText,
            output: '',
            thinking: '',
            timestamp: Date.now(),
            modelName: modelToUse.name || '', // Use selected model's name (modelToUse derived from local selection)
            price: 0, // Price calculation might need adjustment based on the model
            topicId: '', // Assuming topicId is handled elsewhere or not needed here
            translateId: Date.now().toString() + "_" + (Math.random() * 1000).toFixed(0),
            modelId: modelToUse.id || '' // Use selected model's ID
        });
    }

    // Remove handler for local ModelSelector change
    // const handleModelSelectionChange = (selectedIds: string[]) => {
    //     setModelsSelectedForTranslate(selectedIds);
    // };


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
                    <ModelSelector
                        // selectedModelIds={modelsSelectedForTranslate} // Removed prop
                        // onChange={handleModelSelectionChange} // Removed prop
                        // Disable if no models are configured globally (via config hook)
                        disabled={configuredModels.length === 0}
                    />
                </div>
            </div>
            <TranslateItems deleteTranslation={deleteTranslation} />
        </Stack>
    );
};

export default Input;
