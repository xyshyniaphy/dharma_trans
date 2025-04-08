/**
 * Input Component - Handles text input, processing, and display of translation results
 * Features:
 * - Text input area for user to enter text
 * - Processing button to trigger translation
 * - Display areas for model thinking process and translation results
 * - History management with delete functionality
 */
import React, { useRef, useState } from 'react';
import { Button, Form, Stack } from 'react-bootstrap';

import { useCurrentModel } from './hooks/currentModelHook';
import { useTranslatorStatus } from './hooks/useTranslatorStatus';
import { useCurrentTranslate } from './hooks/currentTranslateHook';
import { TranslateItems } from './TranslateItems';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Translation } from './translation_interface';

// Props interface for the Input component
interface InputProps {
   
}

const Input: React.FC<InputProps> = ({
}) => {
    
    const [{isProcessing}, updateStatus] = useTranslatorStatus();
    const [currentModel, _] = useCurrentModel();

    const [inputText, setInputText] = useState<string>('');

    //todo : convert to use recoil
    const [transHistory, _setTransHistory] = useLocalStorage<Array<Translation>>('trans_history', []);
    const [_trans, setTranslate] = useCurrentTranslate();

    function removeFromHistory(id: string): void {
        
    }


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
                <Button
                    onClick={processText}
                    id="processBtn"
                    variant="primary"
                    disabled={isProcessing || !inputText}
                    className="flex-grow-1"
                >
                    {isProcessing ? '翻译中' : ' 翻译 (' + currentModel?.name + ')'}
                </Button>
            </div>
            <TranslateItems
                translations={transHistory}
                removeFromHistory={removeFromHistory}
            />
        </Stack>
    );
};

export default Input;
