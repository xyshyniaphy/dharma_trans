import React, { useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Translation } from './interface/translation_interface';
import { faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './TranslateItem.module.css';

type TranslateItemProps = {
  //translation result
  translation?: Translation;
  deleteTranslation?: (translateId: string) => Promise<void>;
};

export const TranslateItem: React.FC<TranslateItemProps> = ({
  translation,
  deleteTranslation
}) => {
  // Ref for auto-scrolling the thinking text area
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // this is used to show  translation result
  const out = translation?.output || '';
  const think = translation?.thinking || '';

  // Auto-scroll thinking text area when content changes
  React.useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [think]);

  //click delete button on input
  const removeFromHistory = () => {
    if(!translation || !deleteTranslation) return;
    deleteTranslation(translation.translateId);
  };

  const confirmDeleteFromHistory = () => {
    const confirmed = window.confirm('确定要从历史记录中删除此项吗？');
    if (confirmed) {
      removeFromHistory();
    }
  };

  //get model name from translation
  const BaseModelName = (translation? translation.modelName : '').replace('(free)', '');
  const modelName = (BaseModelName&& BaseModelName.length > 0 && BaseModelName.includes(':'))
  ? BaseModelName.split(':')[1]: BaseModelName;

  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(out);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 500);
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
          {translation && (
            <div className="d-flex justify-content-between align-items-center">
             
                <div className={`${styles['hover-buttons']} hover-buttons`} style={{ opacity: 0, transition: 'opacity 0.2s' }}>
                  <Button variant="link" className="p-2 rounded" disabled={showCopied} onClick={handleCopy}>
                    <FontAwesomeIcon icon={faCopy}/>
                  </Button>
                </div>
                <Form.Label className="fw-bold">{modelName}</Form.Label>
                <div className={`${styles['hover-buttons']} hover-buttons`} style={{ opacity: 0, transition: 'opacity 0.2s' }}>
                  <Button variant="link" className="p-2 rounded" onClick={confirmDeleteFromHistory}>
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
             
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