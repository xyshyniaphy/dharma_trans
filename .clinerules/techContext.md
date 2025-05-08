# Tech Context for Darma Trans

## Technologies Used
- Frontend: React, TypeScript, React-Bootstrap
- State Management: Recoil
- Backend: Cloudflare Workers
- Database: D1 database, KV storage

## Development Setup
- Operating System: Windows 11
- Development Environment: VSCode
- Package Management: npm (as indicated by package.json and package-lock.json files)
- Build Tools: Vite (from viteui directory)

## Technical Constraints
- Server-side code must run on Cloudflare Workers, so avoid any dependencies that require a traditional server environment.
- UI must be in Chinese, requiring localization practices.
- Adhere to best practices: Do not remove comments, add comments for changes, and do not alter useEffect dependencies.

## Dependencies
- React and related libraries for frontend development.
- Cloudflare-specific SDKs for Workers, D1, and KV interactions.
- Other dependencies as listed in package.json files in the project directories.

## Tool Usage Patterns
- Use Wrangler for deploying and managing Cloudflare Workers.
- Employ TypeScript for type-safe code in React components.
- Utilize Recoil hooks for efficient state management across components.
- Follow Windows commands for any CLI operations.

<!-- Initialized by Cline on 5/8/2025 based on previous Memory Bank files. -->
