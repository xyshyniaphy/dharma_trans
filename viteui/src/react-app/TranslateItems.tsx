import { useMemo } from "react"; // Removed useEffect
import { TranslateItem } from "./TranslateItem";
import { Translation } from "./interface/translation_interface";
import { useCurrentTranslate } from "./hooks/currentTranslateHook";
import { useTransHistory } from "./hooks/transHistoryHook";
import { Table } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesomeIcon
import { faCopy } from '@fortawesome/free-solid-svg-icons'; // Import the copy icon
import { cleanHtmlForExcel } from "./excel_paste"; // Import the cleaning function
// Removed useTranslatorStatus import

type TranslateItemsProps = {
  deleteTranslation: (translationId: string) => Promise<void>;
  // Add prop for updating expansion state - implementation will be added later in the hook
  updateTranslationExpansion: (translateId: string, isExpanded: boolean) => void;
};

// Helper function to group translations by transBatchId (remains the same)
const groupTranslations = (translations: Translation[]) => {
  const grouped: { [key: string]: Translation[] } = {};
  translations.forEach((t) => {
    // Initialize isThinkingExpanded if it's undefined
    if (t.isThinkingExpanded === undefined) {
        t.isThinkingExpanded = false;
    }
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
  updateTranslationExpansion // Destructure the new prop
}) => {
  const { transHistory } = useTransHistory();
  const [translate, _setTranslate] = useCurrentTranslate(); // Current translation in progress
  // Removed translatorStatus and related useEffect

  // Memoize the grouped translations to avoid re-calculation on every render
  // The grouping function now initializes isThinkingExpanded if needed
  const groupedHistory = useMemo(() => groupTranslations(transHistory), [transHistory]);

  // Render the current translation item if it exists
  const currentTransItem = translate ? (
    <TranslateItem
      key={`current-${translate.timestamp}`} // Use a distinct key prefix
      translation={translate}
      deleteTranslation={undefined} // No delete for item in progress
      showInputCell={true} // Always show input for the current item
      rowSpan={1} // No row span for the current item
      updateTranslationExpansion={updateTranslationExpansion} // Pass down the update function
    />
  ) : null;

  // Function to handle copying the translation result
  const handleCopyToExcel = async () => {
    try {
      // Find the table element
      const excelData = cleanHtmlForExcel();

      // Create a link to download the Excel file
      const link = document.createElement('a');
      link.href = excelData;
      link.download = 'translation.xlsx';

      // Append the link to the document and trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Excel file generated and download started");

    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <Table bordered responsive className="table-striped">
      <thead>
        <tr>
          {/* Only two columns now */}
          <th style={{ width: "50%" }}>原文</th>
          <th style={{ width: "50%" }}>
            翻译结果
            <FontAwesomeIcon
              icon={faCopy}
              style={{ marginLeft: "5px", cursor: "pointer" }}
              onClick={handleCopyToExcel} // Attach the click handler
            />
          </th>
          {/* Removed Thinking header */}
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
              updateTranslationExpansion={updateTranslationExpansion} // Pass down the update function
            />
          ));
        })}
      </tbody>
    </Table>
  );
};
