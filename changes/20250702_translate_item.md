# Changes for Translate Items - 2025/07/02

This document outlines the enhancements made to the translation history view, focusing on adding a selective export feature.

---

## 1. Feature: Selective Export to Excel

A new "导出" (Export) column with checkboxes was added to the translation history table, allowing users to select specific translations to be exported to an Excel file.

### Key Changes:

-   **New "导出" Column**: A new column was added between "原文" (Original Text) and "翻译结果" (Translation Result) to house the export checkboxes.
-   **Check All / Uncheck All**: A checkbox in the header of the "导出" column allows users to select or deselect all translations at once.
-   **Individual Selection**: Each translation row has its own checkbox to toggle its export status.
-   **Default State**: By default, all translations are checked for export when the history is loaded or updated.
-   **Selective Export**: The "导出Excel" (Export to Excel) button now only exports the translations that are checked.

---

## 2. Code Modifications

### `viteui/src/react-app/interface/translation_interface.ts`

-   Added an optional `isExport?: boolean;` property to the `Translation` interface to track the export state of each item.

    ```typescript
    export interface Translation {
      // ... existing properties
      isExport?: boolean; // Optional: Tracks if the item is selected for export, defaults to true
    }
    ```

### `viteui/src/react-app/hooks/transHistoryHook.ts`

-   Exposed the `setTransHistory` function from the `useTransHistory` hook to allow components to update the translation history state directly.

    ```typescript
    export const useTransHistory = () => {
      const [transHistory, setTransHistory] = useRecoilState(transHistoryAtom);
      // ...
      return {
        transHistory,
        setTransHistory, // <-- Added
        // ... other functions
      };
    };
    ```

### `viteui/src/react-app/TranslateItems.tsx`

-   **State Management**: Introduced `useState` and `useEffect` to manage the checked state of the export checkboxes.
-   **UI Changes**: Added the "导出" table header (`<th>`) and the "check all" checkbox.
-   **Event Handlers**: Implemented `handleToggleAll` and `handleToggleOne` to manage the selection state.
-   **Default Check State**: Added a `useEffect` hook to ensure all items are checked for export by default whenever the translation history changes.
-   **Runtime Error Fix**: Modified the `groupTranslations` function to create a mutable copy (`{ ...originalTranslation }`) of each translation object. This resolved a "object is not extensible" error that occurred because the state from Recoil is immutable.

    ```typescript
    // In groupTranslations function
    const t = { ...originalTranslation }; // Create a mutable copy

    // In TranslateItems component
    useEffect(() => {
      // Ensures all items are checked by default on history change
      const updatedHistory = transHistory.map(t => ({ ...t, isExport: true }));
      setTransHistory(updatedHistory);
      setAllChecked(true);
    }, [transHistory.length]); // Dependency array ensures this runs when history length changes
    ```

### `viteui/src/react-app/TranslateItem.tsx`

-   **New Prop**: Added the `onToggleExport` function to the `TranslateItemProps` interface.
-   **UI Changes**: Added a new table cell (`<td>`) containing the individual export checkbox for each translation row.
-   **Data Attribute**: Added a `data-translate-id` attribute to the `<tr>` element to uniquely identify each row for the export filtering logic.

    ```jsx
    <tr className={styles['translate-row']} data-translate-id={translateId}>
      {/* ... */}
      <td className="align-top p-2 text-center">
        <input
          type="checkbox"
          checked={translation.isExport}
          onChange={() => onToggleExport(translation.translateId)}
        />
      </td>
      {/* ... */}
    </tr>
    ```

### `viteui/src/react-app/excel_paste.ts`

-   **Selective Filtering**: The `cleanHtmlForExcel` function was updated to accept an array of `translateId`s. It now filters the table rows based on this array, ensuring only selected items are included in the export.
-   **DOM Cleanup**: Added logic to programmatically remove the "导出" column and the "导出Excel" button from the cloned HTML table before it is converted to an Excel file. This ensures the exported file only contains the relevant translation data.

    ```typescript
    // Example of cleanup logic
    const headerCells = Array.from(clonedTable.querySelectorAll('th'));
    headerCells[1].remove(); // Removes the "导出" header
    // ... similar logic for body cells and the button
    ```

---
