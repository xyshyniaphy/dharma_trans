import { useEffect, useMemo } from "react"; // Import useEffect and useMemo
import { TranslateItem } from "./TranslateItem";
import { Translation } from "./interface/translation_interface";
import { useCurrentTranslate } from "./hooks/currentTranslateHook";
import { useTransHistory } from "./hooks/transHistoryHook";
import { Table } from "react-bootstrap";
import { useTranslatorStatus } from "./hooks/useTranslatorStatus";

type TranslateItemsProps = {
  deleteTranslation: (translationId: string) => Promise<void>;
};

// Helper function to group translations by transBatchId
const groupTranslations = (translations: Translation[]) => {
  const grouped: { [key: string]: Translation[] } = {};
  translations.forEach((t) => {
    if (!grouped[t.transBatchId]) {
      grouped[t.transBatchId] = [];
    }
    grouped[t.transBatchId].push(t);
  });
  // Return as an array of groups, keeping the original order somewhat
  // by sorting groups based on the timestamp of their first item
  return Object.values(grouped).sort((a, b) => b[0].timestamp - a[0].timestamp);
};


export const TranslateItems: React.FC<TranslateItemsProps> = ({
  deleteTranslation,
}) => {
  const { transHistory } = useTransHistory();
  const [translate, _setTranslate] = useCurrentTranslate(); // Current translation in progress
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

  // Memoize the grouped translations to avoid re-calculation on every render
  const groupedHistory = useMemo(() => groupTranslations(transHistory), [transHistory]);

  // Render the current translation item if it exists (likely before grouping is relevant)
  const currentTransItem = translate ? (
    <TranslateItem
      key={`current-${translate.timestamp}`} // Use a distinct key prefix
      translation={translate}
      deleteTranslation={undefined} // No delete for item in progress
      showInputCell={true} // Always show input for the current item
      rowSpan={1} // No row span for the current item
    />
  ) : null;

  return (
    <Table bordered responsive className="table-striped">
      <thead>
        <tr>
          {/* Adjust column widths based on whether 'thinking' column is shown */}
          <th style={{ width: showThinking ? "33.33%" : "50%" }}>原文</th>
          <th style={{ width: showThinking ? "33.33%" : "50%" }}>翻译结果</th>
          {showThinking && <th style={{ width: "33.33%" }}>思考</th>}
        </tr>
      </thead>
      <tbody>
        {/* Render the item currently being processed */}
        {currentTransItem}
        {/* Render grouped history items */}
        {groupedHistory.map((group) => {
          const groupSize = group.length;
          return group.map((translation, index) => (
            <TranslateItem
              key={translation.translateId} // Use unique translateId as key
              translation={translation}
              deleteTranslation={deleteTranslation}
              showInputCell={index === 0} // Only show input cell for the first item in the group
              rowSpan={index === 0 ? groupSize : 1} // Set rowSpan for the first item
            />
          ));
        })}
      </tbody>
    </Table>
  );
};
