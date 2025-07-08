# Dharma Trans

Dharma Trans is a powerful translation application built with a modern tech stack, designed for fast and accurate translations. It runs on Cloudflare Workers for a scalable, serverless backend and features a responsive frontend built with React and TypeScript.

## Features

-   **Real-time Translation**: Get instant translations for your text.
-   **Translation History**: View and manage your past translations.
-   **Model Selection**: Choose from various translation models to suit your needs.
-   **Keyboard Shortcuts**: Press `Enter` to translate and `Ctrl+Enter` to create a new line in the input field.
-   **Re-Input from History**: A refresh icon appears on hover over the original text in the history, allowing you to quickly re-populate the input field for re-translation. Clicking the icon also automatically scrolls the page to the top.
-   **Selective Export to Excel**: A new "导出" (Export) column with checkboxes allows you to select specific translations to be exported to an Excel file.
-   **Clear Button**: A "清空" (Clear) button allows for quick clearing of the input text area.
-   **Character Counter**: The character count is now displayed inside the "翻译" (Translate) button, updating as you type.
-   **Chinese UI**: The user interface is fully localized in Chinese.

## Tech Stack

-   **Frontend**: React, TypeScript, React-Bootstrap
-   **State Management**: Recoil
-   **Backend**: Cloudflare Workers
-   **Database**: D1, KV Storage

## Getting Started

1.  Clone the repository.
2.  Install the dependencies for the `api` and `viteui` directories:
    ```bash
    cd api
    npm install
    cd ../viteui
    npm install
    ```
3.  Configure your Cloudflare credentials and `wrangler.toml` files.
4.  Run the development server:
    ```bash
    cd viteui
    npm run dev
    ```

## Recent Changes
*   **2025-07-03: Fix Config Save Logic**
    *   Corrected the save logic in the configuration modal to allow saving the API key without requiring a model to be selected.
    *   Resolved a build error by removing an unused variable.
    *   See `changes/20250703_fix_config_save_logic.md` for more details.

---
