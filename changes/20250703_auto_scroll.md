# Auto-Scroll Feature

## Date: 2025-07-03

### Overview
Added an auto-scroll-to-top feature to the re-input functionality.

### Changes Made
- **`TranslateItem.tsx`**: Modified the `onClick` handler for the re-input button. After the input text is updated, `window.scrollTo(0, 0)` is called to scroll the page to the top, improving user experience by bringing the input field into view.

### Affected Files
- `viteui/src/react-app/TranslateItem.tsx` (Modified)
