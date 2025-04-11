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

    // State to track the models selected *in this component* for the next translation
    const [modelsSelectedForTranslate, setModelsSelectedForTranslate] = useState<string[]>([]);

    // Get only the models configured in settings from the full list
    const configuredModels = models.filter((m: OpenRouterModel) => selectedModels.includes(m.id));

    // Effect to initialize or update the selection in this component based on global config
    useEffect(() => {
        // When global config changes, update the local selection
        // Prioritize keeping existing valid selections if possible, otherwise default to global
        const validLocalSelection = modelsSelectedForTranslate.filter(id => selectedModels.includes(id));
        if (validLocalSelection.length > 0) {
             // If some locally selected models are still valid in the global config, keep them
             setModelsSelectedForTranslate(validLocalSelection);
        } else {
             // Otherwise, reset local selection to match the global config (or empty if none)
             setModelsSelectedForTranslate(selectedModels);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedModels]); // Rerun only when global config models change


    function processText(_event: any): void {
        // Use the local selection state
        if (!modelsSelectedForTranslate || modelsSelectedForTranslate.length === 0) {
            alert("Please select at least one model to use for translation or configure models in settings.");
            return;
        }
        if (!inputText) return;

        // --- Logic to select a model for this translation ---
        // Simple approach: use the first model from the local selection.
        const modelIdToUse = modelsSelectedForTranslate[0];
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

    // Handler for the ModelSelector change
    const handleModelSelectionChange = (selectedIds: string[]) => {
        setModelsSelectedForTranslate(selectedIds);
    };


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
                    // Disable if no input OR no model is selected in the local state
                    disabled={!inputText || !modelsSelectedForTranslate || modelsSelectedForTranslate.length === 0}
                    onClick={processText}
                    className="flex-grow-1" // Let button take available space
                 >
                    翻译
                </Button>
                {/* Use ModelSelector, passing only the configured models */}
                <div style={{ minWidth: '150px' }}> {/* Wrapper to control width if needed */}
                    <ModelSelector
                        models={configuredModels} // Pass only the models configured in settings
                        selectedModelIds={modelsSelectedForTranslate} // Use local state for selection
                        onChange={handleModelSelectionChange} // Update local state
                        disabled={configuredModels.length === 0} // Disable if no models are configured globally
                    />
                </div>
            </div>
            <TranslateItems deleteTranslation={deleteTranslation} />
        </Stack>
    );
};

export default Input;
