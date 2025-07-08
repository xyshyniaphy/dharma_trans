# Move Character Counter into Translate Button

## Date
2025-07-08

## Change Description
Moved the character count indicator from the input label row into the "翻译" (Translate) button.

### Details
- The character count is now displayed as a badge inside the "翻译" button.
- The count appears only when there is text in the input field.
- This change streamlines the UI by combining related information into a single element.

## Files Modified
- `viteui/src/react-app/Input.tsx`: Relocated the character count display logic.
- `README.md`: Updated the features list to reflect the new location of the character counter.
- `.clinerules/input_component.md`: Updated the component documentation to describe the new button behavior.
