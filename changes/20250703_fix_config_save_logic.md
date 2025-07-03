# Change Log: Fix Config Save Logic

## Date
2025-07-03

## Description
This change addresses a critical bug in the `Config.tsx` component that prevented users from saving their API key if they had not yet selected a translation model. The save logic was overly restrictive and has been corrected.

## Changes Made
1.  **Modified `saveAndClose` function in `Config.tsx`**:
    - Removed the validation check for `config.selectedModels` and `config.selectedModels.length`.
    - The function now only validates that the `tempApiKey` has a minimum length of 10 characters.
    - This allows users to save their API key independently of model selection, which is handled in a different part of the UI.

2.  **Updated "Save" Button State**:
    - The `disabled` property of the "Save" button in `Config.tsx` was updated to only check for the presence and length of the `tempApiKey`.

3.  **Resolved Build Error**:
    - Removed the unused `models` state variable from `Config.tsx`, which was causing a TypeScript build error (`TS6133: 'models' is declared but its value is never read`).

4.  **Updated Documentation**:
    - The architecture document `.clinerules/config_component.md` was updated to accurately reflect the new, simpler save logic.
