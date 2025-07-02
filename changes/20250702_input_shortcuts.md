# Change Log - 2025-07-02

## Feature: Enhanced Input Component

### Summary
Updated the `Input.tsx` component to improve user experience by adding keyboard shortcuts for translation and text entry.

### Changes
- **Enter to Translate**: Pressing the `Enter` key in the text input area now triggers the translation process, equivalent to clicking the "翻译" button.
- **Ctrl+Enter for New Line**: Pressing `Ctrl+Enter` now inserts a new line in the text input area, allowing for multi-line text entry.
- **UI Instruction**: Added a small text label below the "翻译" button to inform users of the new keyboard shortcuts: "Enter to translate, Ctrl+Enter for new line."
- **Robust Implementation**: The `handleKeyDown` event handler was refined to ensure reliable behavior across different browsers by manually managing state and cursor position for the `Ctrl+Enter` action.
