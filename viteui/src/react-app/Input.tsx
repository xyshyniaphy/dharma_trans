/**
 * Input Component - Handles text input, processing, and display of translation results
 * Features:
 * - Text input area for user to enter text
 * - Processing button to trigger translation
 * - Display areas for model thinking process and translation results
 * - History management with delete functionality
 */
import React from 'react';
import { Form, Stack, Dropdown, Button } from 'react-bootstrap';
import { useCurrentModel } from './hooks/currentModelHook';
import { useModelsState } from './hooks/modelsHook';
import { TranslateItems } from './TranslateItems';
import { useDTConfig } from './hooks/configHook';
import { useTranslatorExe } from './hooks/translatorExeHook';        
// Props interface for the Input component
interface InputProps {
   
}

const Input: React.FC<InputProps> = ({
}) => {
    const [currentModel, setCurrentModel] = useCurrentModel();
    const { updateConfig } = useDTConfig();

    const [inputText, setInputText] = React.useState<string>('');

    const { translate } = useTranslatorExe();

    const [models, _setModels] = useModelsState();

 
    function processText(_event: any): void {
        setInputText('');
        translate(inputText);
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

            {/* Processing button */}
            <div className="d-flex gap-2 w-100">
                <div className="btn-group flex-grow-1">
                    <Button
                        variant="primary" 
                        disabled={!inputText}
                        onClick={processText}
                        className="flex-grow-1"
                        style={{ borderTopRightRadius: '0.375rem', borderBottomRightRadius: '0.375rem' }}
                    >
                        { '翻译 (' + currentModel?.name + ')'}
                    </Button>
                    <Dropdown style={{ marginLeft: '8px' }}>
                        <Dropdown.Toggle 
                            split 
                            variant="success" 
                        >
                            模型
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {models.length === 0 ? (
                                <Dropdown.Item disabled>请先输入有效API Key</Dropdown.Item>
                            ) : (
                                models.map((model: any) => (
                                    <Dropdown.Item 
                                        key={model.name} 
                                        onClick={() => {setCurrentModel(model); updateConfig({ selectedModel: model.id })}}
                                    >
                                        {model.name}
                                    </Dropdown.Item>
                                ))
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
            <TranslateItems />
        </Stack>
    );
};

export default Input;
