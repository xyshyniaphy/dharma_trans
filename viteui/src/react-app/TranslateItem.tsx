import React, { useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Translation } from './interface/translation_interface';
import { faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './TranslateItem.module.css';
import { useTranslatorStatus } from './hooks/useTranslatorStatus'; // Import hook to get status

// Updated Props interface
type TranslateItemProps = {
  translation?: Translation;
  deleteTranslation?: (translateId: string) => Promise<void>;
  showInputCell: boolean; // Prop to control rendering of the input cell
  rowSpan: number; // Prop to set the rowSpan for the input cell
};

export const TranslateItem: React.FC<TranslateItemProps> = ({
  translation,
  deleteTranslation,
  showInputCell, // Destructure new props
  rowSpan,       // Destructure new props
}) => {
  // Ref for auto-scrolling the thinking preformatted block
  const preRef = useRef<HTMLPreElement>(null); // Changed type to HTMLPreElement
  const [translatorStatus] = useTranslatorStatus(); // Get translator status
  const { showThinking } = translatorStatus; // Destructure showThinking status

  // this is used to show translation result
  const out = translation?.output || '';
  const think = translation?.thinking || '';

  // Auto-scroll thinking text area when content changes
  React.useEffect(() => {
    // Only scroll if the thinking column is actually shown
    if (showThinking && preRef.current) { // Use preRef here
      preRef.current.scrollTop = preRef.current.scrollHeight; // Use preRef here
    }
  }, [think, showThinking]); // Add showThinking dependency

  //click delete button on input
  const removeFromHistory = () => {
    if(!translation || !deleteTranslation) return;
    // Use a safe way to delete, catch potential errors
    try {
        deleteTranslation(translation.translateId);
    } catch (error) {
        console.error("Error deleting translation:", error);
        // Optionally rethrow or handle UI feedback here
        // throw error; // Rethrow if the caller needs to handle it
    }
  };

  const confirmDeleteFromHistory = () => {
    // Check if delete function is provided before confirming
    if (!deleteTranslation) return;
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
    // Use a safe way to copy, catch potential errors
    try {
        navigator.clipboard.writeText(out);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 500);
    } catch (error) {
        console.error("Error copying text:", error);
        // Optionally rethrow or handle UI feedback here
        // throw error;
    }
  };

  return (
    // Add a class for hover effects if needed, applied to the row
    <tr className={styles['translate-row']}>
      {/* Input Column - Conditionally rendered with rowSpan */}
      {showInputCell && (
        <td className="align-top p-2" rowSpan={rowSpan}>
          {translation?.input || ''}
        </td>
      )}

      {/* Translation Result Column */}
      <td className="align-top p-2">
        <Form.Group>
          {/* Header section with model name and buttons */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            {/* Left button group (Copy) */}
            <div className={`${styles['hover-buttons']}`} style={{ minWidth: '30px' }}> {/* Ensure space */}
              {translation && ( // Only show copy if there's translation data
                <Button variant="link" className="p-1 rounded" disabled={showCopied} onClick={handleCopy} title="复制译文">
                  <FontAwesomeIcon icon={faCopy} size="sm"/>
                </Button>
              )}
            </div>

            {/* Model Name (centered) */}
            <Form.Label className="fw-bold mb-0 text-center flex-grow-1">{modelName}</Form.Label>

            {/* Right button group (Delete) */}
            <div className={`${styles['hover-buttons']}`} style={{ minWidth: '30px' }}> {/* Ensure space */}
              {deleteTranslation && translation && ( // Only show delete if function and data exist
                <Button variant="link" className="p-1 rounded" onClick={confirmDeleteFromHistory} title="删除此项">
                  <FontAwesomeIcon icon={faTrash} size="sm"/>
                </Button>
              )}
            </div>
          </div>
          {/* Markdown rendered output */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {out}
          </ReactMarkdown>
        </Form.Group>
      </td>

      {/* Thinking Column - Conditionally rendered based on global state */}
      {showThinking && (
        <td className="align-top p-2">
          {/* Use a preformatted block or textarea for thinking */}
          <pre ref={preRef} className={styles['thinking-output']}> {/* Use preRef here */}
            {think}
          </pre>
        </td>
      )}
    </tr>
  );
};
