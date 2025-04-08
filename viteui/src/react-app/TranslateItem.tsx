import React, { useState } from 'react';
import { Button, Form, Stack } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Translation } from './translation_interface';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type TranslateItemProps = {
  translation?: Translation;
  removeFromHistory?: () => void;
};

export const TranslateItem: React.FC<TranslateItemProps> = ({
  translation,
  removeFromHistory,
}) => {

  //this is used to show realtime translation result
  const [outputText, setOutputText] = useState<string>('');
  const [thinkingText, setThinkingText] = useState<string>('');

  // this is used to show  translation result
  const out = translation?.output || outputText;
  const think = translation?.thinking || thinkingText;


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
            readOnly
            value={think}
          />
        </Form.Group>
    </Stack>
  );
};
