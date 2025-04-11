import { useEffect } from "react"; // Import useEffect
import { TranslateItem } from "./TranslateItem";
import { Translation } from "./interface/translation_interface";
import { useCurrentTranslate } from "./hooks/currentTranslateHook";
import { useTransHistory } from "./hooks/transHistoryHook";
import { Table } from "react-bootstrap";
import { useTranslatorStatus } from "./hooks/useTranslatorStatus";

type TranslateItemsProps = {
  deleteTranslation: (translationId: string) => Promise<void>;
};

export const TranslateItems: React.FC<TranslateItemsProps> = ({
  deleteTranslation,
}) => {
  const { transHistory } = useTransHistory();
  const [translate, _setTranslate] = useCurrentTranslate();
  const [translatorStatus, updateStatus] = useTranslatorStatus(); // Get translator status and update function
  const { showThinking } = translatorStatus; // Destructure showThinking

  // Effect to update showThinking based on transHistory
  useEffect(() => {
    const shouldShowThinking = transHistory.some(
      (item) => item.thinking && item.thinking.trim() !== ""
    );
    // Only update if the status needs to change
    if (shouldShowThinking !== showThinking) {
      updateStatus({ showThinking: shouldShowThinking });
    }
  }, [transHistory, updateStatus, showThinking]); // Add dependencies

  const currentTransItem = translate ? (
    <TranslateItem
      key={translate.timestamp}
      translation={translate}
      deleteTranslation={undefined}
    />
  ) : null;
  
  return (
    <Table bordered responsive className="table-striped">
      <thead>
        <tr>
          <th style={{ width: showThinking ? "33.33%" : "50%" }}>原文</th>
          <th style={{ width: showThinking ? "33.33%" : "50%" }}>翻译结果</th>
          {showThinking && <th style={{ width: "33.33%" }}>思考</th>}
        </tr>
      </thead>
      <tbody>
        {currentTransItem}
        {transHistory.map((translation: Translation) => (
          <TranslateItem
            key={translation.timestamp}
            translation={translation}
            deleteTranslation={deleteTranslation}
          />
        ))}
      </tbody>
    </Table>
    
  );
};
