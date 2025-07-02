# Re-Input Feature Implementation

## Date: 2025-07-02

### Overview
Added a "re-input" feature that allows users to quickly move text from the translation history back into the main input text area for re-translation or editing.

### Changes Made

1.  **Global State for Input Text**:
    *   Created a new Recoil state atom in `viteui/src/react-app/state/inputTextState.ts` to manage the input text globally.
    *   Created a new custom hook, `useInputText`, in `viteui/src/react-app/hooks/inputTextHook.ts` to provide a simple interface for components to interact with this shared state.

2.  **Component Refactoring**:
    *   **`Input.tsx`**: Refactored to use the `useInputText` hook, replacing its local `useState` for the input field. This connects the main text area to the global state.
    *   **`TranslateItems.tsx`**: Updated to use the `useInputText` hook and pass the `setInputText` function down to child `TranslateItem` components via a new `onReInput` prop.
    *   **`TranslateItem.tsx`**:
        *   Added the `onReInput` prop to its type definition.
        *   Added a refresh icon (`faSync`) button to the "原文" (original text) cell.
        *   The button's `onClick` event now calls `onReInput` to update the global input text with the content from that row.

3.  **Styling**:
    *   Added CSS rules to `viteui/src/react-app/TranslateItem.module.css` to manage the new re-input button.
    *   The button is positioned absolutely in the top-right corner of the cell and is only visible on hover, providing a clean and intuitive user experience.

### Affected Files
- `viteui/src/react-app/state/inputTextState.ts` (Created)
- `viteui/src/react-app/hooks/inputTextHook.ts` (Created)
- `viteui/src/react-app/Input.tsx` (Modified)
- `viteui/src/react-app/TranslateItems.tsx` (Modified)
- `viteui/src/react-app/TranslateItem.tsx` (Modified)
- `viteui/src/react-app/TranslateItem.module.css` (Modified)
