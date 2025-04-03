import React, { useRef } from 'react';
import { Button, Form, Stack } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';

interface InputProps {
    inputText: string;
    outputText: string;
    thinkingText: string;
    isProcessing: boolean;
    status: string;
    setInputText: (text: string) => void;
    processText: () => void;
}

const Input: React.FC<InputProps> = ({
    inputText,
    outputText,
    thinkingText,
    isProcessing,
    status,
    setInputText,
    processText
}) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null); // Moved ref here
    

    // Auto-scroll thinking text area
    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [thinkingText]);

    return (
        <Stack gap={3} className="h-90 overflow-auto">
            <Form.Group className="flex-grow-1">
                <Form.Label className="fw-bold">输入文本：</Form.Label>
                <Form.Control
                    as="textarea"
                    readOnly={isProcessing}
                    className="h-90"
                    placeholder="请在此输入需要翻译的中文文本..."
                    value={inputText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                />
            </Form.Group>

            <div className="d-flex gap-2 w-100">
                <Button
                    onClick={processText}
                    id="processBtn"
                    variant="primary"
                    disabled={isProcessing || !inputText}
                    className="flex-grow-1"
                >
                    {isProcessing ? status : ' 翻译'}
                </Button>
            </div>

            {thinkingText && (
                <Form.Group className="flex-grow-1">
                    <Form.Label className="fw-bold">模型思考过程：</Form.Label>
                    <Form.Control
                        ref={textAreaRef}
                        as="textarea"
                        className="h-90"
                        readOnly
                        placeholder="模型的思考过程将显示在这里..."
                        value={thinkingText}
                    />
                </Form.Group>
            )}

            {outputText && ( // Only show if there is output text
                    <Form.Group className="flex-grow-1">
                        <Form.Label className="fw-bold">翻译结果：</Form.Label>
                        <div className="h-90 overflow-auto border p-2 rounded"> {/* Added border for clarity */}
                            <ReactMarkdown>
                                {outputText}
                            </ReactMarkdown>
                        </div>
                    </Form.Group>
                 )
            }
        </Stack>
    );
};

export default Input;
