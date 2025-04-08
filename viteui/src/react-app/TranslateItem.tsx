import React, { useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Translation } from './translation_interface';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type TranslateItemProps = {
  //translation result
  translation?: Translation;
  //realtime stream when translating, use this first
  outputText?: string;
  thinkingText?: string;
};

export const TranslateItem: React.FC<TranslateItemProps> = ({
  translation,
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

      //click delete button on input
      const removeFromHistory = () => {
        if(!translation) return;
        // const updatedHistory = transHistory.filter(t => t.timestamp !== translate.timestamp);
        // setTransHistory(updatedHistory);
      
    };

  return (
    <tr>
      {/* Input Column */}
      <td className="align-top p-2">
      {translation?.input || ''}
      </td>

      {/* Translation Result Column */}
      <td className="align-top p-2">
        <Form.Group>
          {translation && removeFromHistory && (
            <Button variant="link" className="p-2 rounded float-end" onClick={removeFromHistory}>
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          )}
          <Form.Label className="fw-bold">{translation?.modelName || ''}</Form.Label>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {out}
          </ReactMarkdown>
        </Form.Group>
      </td>

      {/* Thinking Column */}
      <td className="align-top p-2">
      {think}
      </td>
    </tr>
  );
};