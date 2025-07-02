import React, { useState, useEffect } from 'react';
import { useMemo } from "react"; // Removed useEffect
import { TranslateItem } from "./TranslateItem";
import { Translation } from "./interface/translation_interface";
import { useCurrentTranslate } from "./hooks/currentTranslateHook";
import { useTransHistory } from "./hooks/transHistoryHook";
import { Table, Button } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesomeIcon
import { faFileExcel } from '@fortawesome/free-solid-svg-icons'; // Keep Excel icon, remove cloud download
import { cleanHtmlForExcel } from "./excel_paste"; // Import the cleaning function
import { useSetRecoilState } from 'recoil'; // Added useSetRecoilState
import { translatorStatusState } from './state/translatorStatusState'; // Added import for translatorStatusState
import styles from './TranslateItem.module.css';
// Removed useTranslatorStatus import

type TranslateItemsProps = {
  deleteTranslation: (translationId: string) => Promise<void>;
  // Add prop for updating expansion state - implementation will be added later in the hook
  updateTranslationExpansion: (translateId: string, isExpanded: boolean) => void;
};

// Helper function to group translations by transBatchId
const groupTranslations = (translations: Translation[]) => {
  const grouped: { [key: string]: Translation[] } = {};
  translations.forEach((originalTranslation) => {
    // I am creating a mutable copy of the translation object to avoid the "object is not extensible" error.
    const t = { ...originalTranslation };
    // Initialize isThinkingExpanded if it's undefined
    if (t.isThinkingExpanded === undefined) {
        t.isThinkingExpanded = false;
    }
    // Initialize isExport if it's undefined, default to true
    if (t.isExport === undefined) {
        t.isExport = true;
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
  const { transHistory, setTransHistory } = useTransHistory();
  const [translate, _setTranslate] = useCurrentTranslate(); // Current translation in progress
  const [allChecked, setAllChecked] = useState(true);
  // Get the setter function for translatorStatusState to control global thinking visibility
  const setTranslatorStatus = useSetRecoilState(translatorStatusState);

  // Effect to update allChecked state when transHistory changes
  useEffect(() => {
    setAllChecked(transHistory.every(t => t.isExport));
  }, [transHistory]);

  // Memoize the grouped translations to avoid re-calculation on every render
  const groupedHistory = useMemo(() => groupTranslations(transHistory), [transHistory]);

  const handleToggleAll = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);
    const updatedHistory = transHistory.map(t => ({ ...t, isExport: newAllChecked }));
    setTransHistory(updatedHistory);
  };

  const handleToggleOne = (translateId: string) => {
    const updatedHistory = transHistory.map(t =>
      t.translateId === translateId ? { ...t, isExport: !t.isExport } : t
    );
    setTransHistory(updatedHistory);
  };

  // Render the current translation item if it exists
  const currentTransItem = translate ? (
    <TranslateItem
      key={`current-${translate.timestamp}`} // Use a distinct key prefix
      translation={translate}
      deleteTranslation={undefined} // No delete for item in progress
      showInputCell={true} // Always show input for the current item
      rowSpan={1} // No row span for the current item
      updateTranslationExpansion={updateTranslationExpansion} // Pass down the update function
      onToggleExport={handleToggleOne}
    />
  ) : null;

  // Function to handle copying the translation result to Excel file with file dialog
  const handleCopyToExcel = async () => {
    const itemsToExport = transHistory.filter(t => t.isExport);
    if (itemsToExport.length === 0) {
      console.warn("No translations selected to export.");
      alert("没有选择要导出的翻译。");
      return;
    }

    // Set flags: hide thinking divs AND indicate processing start
    setTranslatorStatus(prev => ({ 
      ...prev, 
      hideAllThinkingDiv: true, 
      isProcessing: true // Set isProcessing to true
    }));

    try {
      // Wait for UI updates (thinking hidden, overlay potentially shown)
      await new Promise(resolve => setTimeout(resolve, 0));

      // Call the imported cleanHtmlForExcel function
      const excelBase64Data = cleanHtmlForExcel(itemsToExport.map(t => t.translateId));
      if (!excelBase64Data) {
        console.error("Failed to get table data for Excel export.");
        return; // Finally block will reset flags
      }

      // Decode base64 to binary array
      const binaryExcelData = atob(excelBase64Data);

      // Convert binary array to Uint8Array
      const uint8Array = new Uint8Array(binaryExcelData.length);
      for (let i = 0; i < binaryExcelData.length; i++) {
        uint8Array[i] = binaryExcelData.charCodeAt(i);
      }

      // Create a Blob from the Uint8Array, specifying MIME type for Excel
      const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

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

      console.log("Excel file download dialog should be shown");

    } catch (error) {
      console.error("Error generating or downloading Excel file:", error); 
    } finally {
      // Always reset flags: show thinking divs AND indicate processing end
      setTranslatorStatus(prev => ({ 
        ...prev, 
        hideAllThinkingDiv: false, 
        isProcessing: false // Set isProcessing back to false
      }));
    }
  };

  // Removed tableHtmlId as cleanHtmlForExcel uses querySelector

  return (
    <>

      {/* The table ID is not strictly necessary anymore if cleanHtmlForExcel uses querySelector */}
      {/* Keep it for potential future use or specific styling? Removed for now. */}
      <Table bordered hover responsive size="sm" className={`${styles['translation-table']} table-striped`}>
        <thead>
          <tr>
            {/* Adjusted widths potentially */}
            <th style={{ width: "35%" }}>原文</th>
            <th style={{ width: "5%" }}>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={handleToggleAll}
                title={allChecked ? "取消全选" : "全选"}
              />
              导出
            </th>
            <th style={{ width: "60%" }}>
              翻译结果:
              <Button
                  variant="outline-success" 
                  size="sm" 
                  onClick={handleCopyToExcel} 
                  className="mb-2" // Add some margin below the button
                  title="将所有翻译导出为Excel"
                  // Disable button if there's no history AND no current translation
                  disabled={transHistory.length === 0 && !translate} 
                >
                  <FontAwesomeIcon icon={faFileExcel} /> 导出Excel
            </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Render the item currently being processed */}
          {currentTransItem}
          {/* Render grouped history items */}
          {groupedHistory.map((group) => {
            const groupSize = group.length;
            // Use the actual batchId from the group for the key for the fragment if needed
            // const batchId = group[0].transBatchId; 
            return group.map((translation, index) => (
              <TranslateItem
                key={translation.translateId} // Use unique translateId as key
                translation={translation}
                deleteTranslation={deleteTranslation}
                showInputCell={index === 0} // Only show input cell for the first item in the group
                rowSpan={index === 0 ? groupSize : 1} // Set rowSpan for the first item
                updateTranslationExpansion={updateTranslationExpansion} // Pass down the update function
                onToggleExport={handleToggleOne}
              />
            ));
          })}
        </tbody>
      </Table>
    </>
  );
};
