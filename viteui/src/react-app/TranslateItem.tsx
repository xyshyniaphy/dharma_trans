import React, { useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Translation } from './interface/translation_interface';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type TranslateItemProps = {
  //translation result
  translation?: Translation;
  //realtime stream when translating, use this first
  outputText?: string;
  thinkingText?: string;
  deleteTranslation?: (translateId: string) => Promise<void>;
};

export const TranslateItem: React.FC<TranslateItemProps> = ({
  translation,
  outputText,
  thinkingText,
  deleteTranslation
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
    if(!translation || !deleteTranslation) return;
    deleteTranslation(translation.translateId);
  };
  //get model name from translation
  const BaseModelName = (translation? translation.modelName : '').replace('(free)', '');
  const modelName = (BaseModelName&& BaseModelName.length > 0 && BaseModelName.includes(':'))
  ? BaseModelName.split(':')[1]: BaseModelName;
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
            <div className="d-flex justify-content-between align-items-center">
              <Form.Label className="fw-bold">{modelName}</Form.Label>
              <Button variant="link" className="p-2 rounded" onClick={removeFromHistory}>
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </div>
          )}
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