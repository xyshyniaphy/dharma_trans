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
  const think = thinkingText || translation?.thinking || '';

      // Auto-scroll thinking text area when content changes
      React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [thinkingText]);


  return (

    
    <Stack direction="vertical" gap={3} className=" overflow-auto">
      {/* Input column */}
      <Form.Group className="flex-grow-1">
        <Form.Label className="fw-bold">原文：</Form.Label>
        <Form.Control
          as="textarea"
          className=""
          readOnly
          value={translation?.input || ''}
        />
      </Form.Group>

 

      <Form.Group className="flex-grow-1">
          {translation && (
            <Button variant="link" className="p-2 ms-2 rounded" onClick={removeFromHistory}>
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          )}
          <Form.Label className="fw-bold">{`翻译结果 - (${translation?.modelName})`}</Form.Label>
          <div className=" overflow-auto border p-2 rounded markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {out}
            </ReactMarkdown>
          </div>
        </Form.Group>

        <Form.Group className="flex-grow-1">
          <Form.Label className="fw-bold">思考：</Form.Label>
          <Form.Control
            as="textarea"
            className=""
            ref={textAreaRef}
            readOnly
            value={think}
          />
        </Form.Group>
    </Stack>
  );
};
