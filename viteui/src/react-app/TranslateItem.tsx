import React, { useState } from 'react'; // Removed useRef
import { Button, Form, Collapse } from 'react-bootstrap'; // Added Collapse
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Translation } from './interface/translation_interface';
import { faTrash, faCopy, faBrain, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // Added icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './TranslateItem.module.css';
// Removed useTranslatorStatus import

// Updated Props interface
type TranslateItemProps = {
  translation?: Translation;
  deleteTranslation?: (translateId: string) => Promise<void>;
  showInputCell: boolean; // Prop to control rendering of the input cell
  rowSpan: number; // Prop to set the rowSpan for the input cell
  updateTranslationExpansion: (translateId: string, isExpanded: boolean) => void; // Function to update expansion state
};

export const TranslateItem: React.FC<TranslateItemProps> = ({
  translation,
  deleteTranslation,
  showInputCell,
  rowSpan,
  updateTranslationExpansion, // Destructure the new prop
}) => {
  // Removed preRef and related useEffect/state

  // Translation data or defaults
  const out = translation?.output || '';
  const think = translation?.thinking || '';
  const translateId = translation?.translateId || '';
  // Default to false if undefined
  const isThinkingExpanded = translation?.isThinkingExpanded ?? false;

  // Handler to toggle thinking visibility
  const handleToggleThinking = () => {
    if (!translateId) return; // Need ID to update state
    try {
        updateTranslationExpansion(translateId, !isThinkingExpanded);
    } catch (error) {
        console.error("Error toggling thinking expansion:", error);
        // throw error; // Optionally rethrow
    }
  };

  // Delete handler (remains mostly the same)
  const removeFromHistory = () => {
    if(!translateId || !deleteTranslation) return;
    try {
        deleteTranslation(translateId);
    } catch (error) {
        console.error("Error deleting translation:", error);
        // throw error;
    }
  };

  const confirmDeleteFromHistory = () => {
    if (!deleteTranslation) return;
    const confirmed = window.confirm('确定要从历史记录中删除此项吗？');
    if (confirmed) {
      removeFromHistory();
    }
  };

  // Model name extraction (remains the same)
  const BaseModelName = (translation? translation.modelName : '').replace('(free)', '');
  const modelName = (BaseModelName&& BaseModelName.length > 0 && BaseModelName.includes(':'))
  ? BaseModelName.split(':')[1]: BaseModelName;

  // Copy handler state and function (remains mostly the same)
  const [showCopied, setShowCopied] = useState(false);
  const handleCopy = () => {
    try {
        navigator.clipboard.writeText(out);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 500);
    } catch (error) {
        console.error("Error copying text:", error);
        // throw error;
    }
  };

  // Determine if the thinking section should be available
  const hasThinking = think && think.trim() !== '';

  return (
    <tr className={styles['translate-row']}>
      {/* Input Column - Conditionally rendered with rowSpan */}
      {showInputCell && (
        <td className="align-top p-2" rowSpan={rowSpan}>
          {translation?.input || ''}
        </td>
      )}

      {/* Translation Result Column - Now includes collapsible thinking */}
      <td className="align-top p-2">
        <Form.Group>
          {/* Header section with model name and buttons */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            {/* Left button group (Copy) */}
            <div className={`${styles['hover-buttons']}`} style={{ minWidth: '30px' }}>
              {translation && (
                <Button variant="link" className="p-1 rounded" disabled={showCopied} onClick={handleCopy} title="复制译文">
                  <FontAwesomeIcon icon={faCopy} size="sm"/>
                </Button>
              )}
            </div>

            {/* Model Name (centered) */}
            <Form.Label className="fw-bold mb-0 text-center flex-grow-1">{modelName}</Form.Label>

            {/* Right button group (Delete) */}
            <div className={`${styles['hover-buttons']}`} style={{ minWidth: '30px' }}>
              {deleteTranslation && translation && (
                <Button variant="link" className="p-1 rounded" onClick={confirmDeleteFromHistory} title="删除此项">
                  <FontAwesomeIcon icon={faTrash} size="sm"/>
                </Button>
              )}
            </div>
          </div>

          {/* Collapsible Thinking Section */}
          {hasThinking && (
            <div className="mb-2"> {/* Add margin below thinking section */}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleToggleThinking}
                aria-controls={`thinking-collapse-${translateId}`}
                aria-expanded={isThinkingExpanded}
                className="d-flex align-items-center gap-1" // Align icon and text
              >
                <FontAwesomeIcon icon={isThinkingExpanded ? faEyeSlash : faBrain} />
                {isThinkingExpanded ? '隐藏思考' : '显示思考'}
              </Button>
              <Collapse in={isThinkingExpanded}>
                <div id={`thinking-collapse-${translateId}`} className={`mt-2 p-2 border rounded ${styles['thinking-output-collapsible']}`}>
                  {/* Use preformatted block for thinking with wrapping style */}
                  {/* Added className={styles['thinking-pre']} */}
                  <pre className={styles['thinking-pre']}>
                    {think}
                  </pre>
                </div>
              </Collapse>
            </div>
          )}

          {/* Markdown rendered output */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {out}
          </ReactMarkdown>
        </Form.Group>
      </td>

      {/* Removed the separate Thinking Column <td> */}
    </tr>
  );
};
