import React, { useRef, useState } from 'react';
import { Button, Form, Stack } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Translation } from './translation_interface';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type TranslateItemProps = {
  //translation result
  translation?: Translation;
  removeFromHistory?: () => void;

  //realtime stream when translating, use this first
  outputText?: string;
  thinkingText?: string;
};

export const TranslateItem: React.FC<TranslateItemProps> = ({
  translation,
  removeFromHistory,
  outputText,
  thinkingText
}) => {

  // Ref for auto-scrolling the thinking text area
  const textAreaRef = useRef<HTMLTextAreaElement>(null);


  // this is used to show  translation result
  const out = outputText || translation?.output || '';
  const think = translation?.thinking || thinkingText;

      // Auto-scroll thinking text area when content changes
      React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [thinkingText]);


  return (

    
    <Stack direction="horizontal" gap={3} className="overflow-auto w-100">
  <Form.Group className="w-33">
    <Form.Label className="fw-bold">原文：</Form.Label>
    <Form.Control
      as="textarea"
      className="h-100"
      readOnly
      value={translation?.input || ''}
    />
  </Form.Group>

  <Form.Group className="w-33">
    {translation && (
      <Button variant="link" className="p-2 ms-2 rounded" onClick={removeFromHistory}>
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    )}
    <Form.Label className="fw-bold">{`翻译结果 - (${translation?.modelName})`}</Form.Label>
    <div className="overflow-auto border p-2 rounded markdown-body h-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {out}
      </ReactMarkdown>
    </div>
  </Form.Group>

  <Form.Group className="w-33">
    <Form.Label className="fw-bold">思考：</Form.Label>
    <Form.Control
      as="textarea"
      className="h-100"
      ref={textAreaRef}
      readOnly
      value={think}
    />
  </Form.Group>
</Stack>
  );
};
