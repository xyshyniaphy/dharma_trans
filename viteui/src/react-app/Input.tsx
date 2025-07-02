/**
 * Input Component - Handles text input, processing, and display of translation results
 * Features:
 * - Text input area for user to enter text
 * - Processing button to trigger translation
 * - Display areas for model thinking process and translation results
 * - History management with delete functionality
 */
// I am replacing the local state management with the new Recoil-based hook
// to synchronize the input text across components.
import React, { useRef, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap'; // Removed Dropdown
import { useModelsState } from './hooks/modelsHook';
import { TranslateItems } from './TranslateItems';
import ModelSelector from './ModelSelector'; // Import ModelSelector
import { useDTConfig } from './hooks/configHook';
import { useTranslatorExe } from './hooks/translatorExeHook';
import { Translation } from './interface/translation_interface';
import { OpenRouterModel } from './hooks/filterModels'; // Import OpenRouterModel
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import { fetchTransData } from './utils/translate_tool'; // Import fetchTransData
import { useInputText } from './hooks/inputTextHook'; // Import the new hook
import './Input.css'; // Import the CSS file

// Updated Props interface for the Input component
interface InputProps {
    addTranslationToTopic: (translation: Translation) => Promise<void>;
    deleteTranslation: (translationId: string) => Promise<void>;
    updateTranslationExpansion: (translateId: string, isExpanded: boolean) => void; // Added prop
}

const Input: React.FC<InputProps> = ({
    addTranslationToTopic,
    deleteTranslation,
    updateTranslationExpansion // Destructure the new prop
}) => {
    const { startTranslate } = useTranslatorExe({ addTranslationToTopic });
    const { config } = useDTConfig();

    // I am replacing the local useState with the useInputText hook to use global state.
    const { inputText, setInputText } = useInputText();
    const [models] = useModelsState(); // Get the full list of available models
    const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the textarea

    const [{ }, updateStatus] = useTranslatorStatus();

    // Effect to handle textarea auto-grow
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height to recalculate scrollHeight
            textarea.style.height = 'auto';
            // Set height based on content unless it's empty
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
             // Ensure overflow is handled if needed, but prefer auto height
            textarea.style.overflowY = 'hidden';
        }
    }, [inputText]); // Depend on inputText to trigger resize

    // Add comment for my changes
    // Handle key down events in the textarea for a more robust implementation
    // - Enter: Trigger translation
    // - Ctrl+Enter: Insert a new line at the current cursor position
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter') {
            if (event.ctrlKey) {
                // For Ctrl+Enter, we manually insert a newline character
                event.preventDefault();
                const textarea = event.currentTarget;
                const { selectionStart, selectionEnd, value } = textarea;
                const newValue =
                    value.substring(0, selectionStart) +
                    '\n' +
                    value.substring(selectionEnd);
                setInputText(newValue);

                // We need to manually update the cursor position after the state update
                // Using a timeout to ensure it runs after the re-render
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
                }, 0);
            } else {
                // For Enter alone, we prevent the default newline and trigger translation
                event.preventDefault();
                if (inputText && config.selectedModels && config.selectedModels.length > 0) {
                    processText(event);
                }
            }
        }
    };

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
            // Fetch transData before the loop to avoid multiple calls
            const transData = await fetchTransData();
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

                // Add transBatchId to the translation object
                // isThinkingExpanded defaults to false via the interface/hook logic
                await startTranslate({
                    input: textToTranslate, // Use the stored input text
                    output: '',
                    thinking: '',
                    timestamp: Date.now(),
                    modelName: modelToUse.name, // Use name or ID
                    price: 0, // Price calculation might need adjustment
                    translateId: uniqueTranslateId, // Use the unique ID
                    modelId: modelToUse.id, // Use the current model's ID
                    transBatchId: transBatchId // Add the batch ID
                    // isThinkingExpanded is implicitly false here
                }, modelToUse, transData); // Pass the modelId as the second argument and transData as the third
                transNo++;
            }
        } catch (error) {
            // Add robust error handling
            console.error("Error during text processing:", error);
            updateStatus({ isProcessing: false, status: '翻译出错' }); // Update status on error
            // Optionally rethrow or display a user-friendly message
            // throw error;
        } finally {
            // Correctly update status by passing a partial state object
            updateStatus({ isProcessing: false, status: '' });
        }
    }


    return (
        // Main container using flexbox layout defined in Input.css
        <div className="input-container">
            {/* Header section (Input + Controls), not scrollable */}
            <div className="input-header">
                {/* Input text area */}
                <Form.Group className="flex-grow-1">
                    <Form.Label className="fw-bold">输入文本：</Form.Label>
                    <Form.Control
                        ref={textareaRef} // Add ref to textarea
                        as="textarea"
                        rows={1} // Set initial rows to 1
                        style={{ resize: 'none', overflowY: 'hidden' }} // Initial style for auto-grow
                        placeholder="请在此输入需要翻译的文本..."
                        value={inputText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            setInputText(e.target.value);
                            // Manual triggerresize on change might be needed if useEffect isn't sufficient
                            // const textarea = e.target;
                            // textarea.style.height = 'auto';
                            // textarea.style.height = `${textarea.scrollHeight}px`;
                        }}
                        onKeyDown={handleKeyDown} // Add keydown handler for Enter/Ctrl+Enter
                        maxLength={4064}
                    />
                </Form.Group>

                {/* Processing button and ModelSelector */}
                <div className="d-flex gap-2 mt-2 align-items-start"> {/* Add margin-top for spacing */}
                    <div className="flex-grow-1">
                        <Button
                            variant="primary"
                            // Disable if no input OR no model is selected in the global config state
                            disabled={!inputText || !config.selectedModels || config.selectedModels.length === 0}
                            onClick={processText}
                            className="w-100" // Let button take available space
                        >
                            翻译
                        </Button>
                        {/* Add comment for my changes */}
                        {/* Instruction for translation trigger keys */}
                        <div className="text-muted small mt-1">
                            按Enter键开始翻译, 按Ctrl+Enter换行.
                        </div>
                    </div>
                    {/* Use ModelSelector, passing only the configured models */}
                    <div style={{ minWidth: '150px' }}> {/* Wrapper to control width if needed */}
                        <ModelSelector />
                    </div>
                </div>
            </div>

            {/* Scrollable translations section */}
            <div className="scrollable-translations">
                <TranslateItems
                    deleteTranslation={deleteTranslation}
                    updateTranslationExpansion={updateTranslationExpansion}
                />
            </div>
        </div>
    );
};

export default Input;
