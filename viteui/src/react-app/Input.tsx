/**
 * Input Component - Handles text input, processing, and display of translation results
 * Features:
 * - Text input area for user to enter text
 * - Processing button to trigger translation
 * - Display areas for model thinking process and translation results
 * - History management with delete functionality
 */
import React, { useRef } from 'react';
import { Button, Form, Stack } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { Translation } from './translation_interface';

// Props interface for the Input component
interface InputProps {
    inputText: string; // Current input text
    outputText: string; // Default output text
    thinkingText: string; // Default thinking text
    isProcessing: boolean; // Processing state flag
    status: string; // Current status message
    setInputText: (text: string) => void; // Callback to update input text
    processText: () => void; // Callback to trigger text processing
    translation?: Translation; // Translation object containing results
    removeFromHistory: () => void; // Callback to remove from history
    selectedModel: string; // Selected model for translation
}

const Input: React.FC<InputProps> = ({
    inputText,
    outputText,
    thinkingText,
    isProcessing,
    status,
    setInputText,
    processText,
    translation,
    removeFromHistory,
    selectedModel
}) => {
    // Ref for auto-scrolling the thinking text area
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll thinking text area when content changes
    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [thinkingText]);

    // Use previous translation output if available, fallback to default
    const outTxt = translation?.output ?? outputText;

    // Use previous translation thinking if available, fallback to default
    const thinkTxt = translation?.thinking ?? thinkingText;

    const price = translation?.price ?? 0;

    return (
        <Stack gap={3} className="h-90 overflow-auto">
            {/* Input text area */}
            <Form.Group className="flex-grow-1">
                <Form.Label className="fw-bold">输入文本：</Form.Label>
                <Form.Control
                    as="textarea"
                    className="h-90"
                    placeholder="请在此输入需要翻译的中文文本..."
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
                    {isProcessing ? status : ' 翻译 (' + selectedModel + ')'}
                </Button>
            </div>

            {/* Thinking process display */}
            {thinkTxt && (
                <Form.Group className="flex-grow-1">
                    <Form.Label className="fw-bold">模型思考过程：</Form.Label>
                    <Form.Control
                        ref={textAreaRef}
                        as="textarea"
                        className="h-90"
                        readOnly
                        placeholder="模型的思考过程将显示在这里..."
                        value={thinkTxt}
                    />
                </Form.Group>
            )}

            {/* Translation results display */}
            {outTxt && (
                    <Form.Group className="flex-grow-1">
                        {/* Delete button for history items */}
                        {translation && (
                            <Button variant="link" className="p-2 ms-2  rounded" onClick={removeFromHistory}>
                                <FontAwesomeIcon icon={faTrash} />
                            </Button>
                        )}  
                        <Form.Label className="fw-bold">{`翻译结果 - (${translation?.modelName}) ${new Date(translation?.timestamp || Date.now()).toLocaleString()} 价格 - $${price}`}</Form.Label>
                        <div className="h-90 overflow-auto border p-2 rounded markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {outTxt}
                            </ReactMarkdown>
                        </div>
                    </Form.Group>
                 )
            }
        </Stack>
    );
};

export default Input;
