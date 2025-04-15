import { useMemo } from "react"; // Removed useEffect
import { TranslateItem } from "./TranslateItem";
import { Translation } from "./interface/translation_interface";
import { useCurrentTranslate } from "./hooks/currentTranslateHook";
import { useTransHistory } from "./hooks/transHistoryHook";
import { Table } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesomeIcon
import { faCloudDownload } from '@fortawesome/free-solid-svg-icons'; // Import the copy icon
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

  // Function to handle copying the translation result to Excel file with file dialog
  const handleCopyToExcel = async () => {
    try {
      // Get the cleaned excel data (assuming cleanHtmlForExcel returns data in XLSX format)
      const excelData = cleanHtmlForExcel();

      // Convert excelData to Blob for file download, specifying MIME type for Excel
      const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create a URL for the Blob, which allows downloading the Blob as a file
      const url = URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = url;

      // Set default filename for the downloaded file
      const now = new Date();
      const year = now.getFullYear().toString().slice(2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const filename = `translation_${year}_${month}_${day}.xlsx`;
      link.download = filename; // Specify the filename for the download

      // Append the link to the document body (it doesn't need to be visible)
      document.body.appendChild(link);

      // Programmatically click the link to trigger the file download dialog
      link.click();

      // Remove the link from the document body after download is triggered
      document.body.removeChild(link);

      // Clean up the URL object to release resources and prevent memory leaks
      URL.revokeObjectURL(url);

      console.log("Excel file download dialog should be shown"); // Log to confirm download process

    } catch (error) {
      console.error("Error generating or downloading Excel file:", error); // Log any errors during the process
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
              icon={faCloudDownload}
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
