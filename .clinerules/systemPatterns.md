# System Patterns for Darma Trans

## System Architecture
The architecture consists of a frontend built with React and TypeScript, running client-side, and a backend using Cloudflare Workers for serverless operations. Data persistence is managed through D1 database for structured data and KV storage for key-value pairs.

## Key Technical Decisions
- Use Cloudflare Workers for server-side logic to ensure scalability and low latency.
- Implement React components with TypeScript for type safety.
- Utilize Recoil for state management to efficiently share states across sub-components without prop drilling.
- Ensure all UI strings are in Chinese for localization.
- Follow React best practices by not altering useEffect dependencies and maintaining comments in code.

## Design Patterns in Use
- State Management Pattern: Recoil atoms and selectors for global state handling.
- Component Composition: Break down UI into reusable React components (e.g., Input, ModelSelector, ViewHistory).
- API Interaction Pattern: Use fetch or Axios in frontend to communicate with Cloudflare Worker endpoints for translations and data operations.
- Error Handling Pattern: Implement try-catch blocks in asynchronous functions and provide user-friendly error messages.

## Component Relationships
- **App.tsx**: Main component that orchestrates the layout, including DNavBar, Input, TranslateItems, and ViewHistory.
- **Hooks**: Custom hooks like transHistoryHook.ts manage state and side effects, interacting with Recoil atoms.
- **API Layer**: Frontend components call backend APIs via Cloudflare Workers for translation services, which in turn interact with D1 and KV.

## Critical Implementation Paths
- Translation Flow: User input -> Frontend hook processes -> API call to Cloudflare Worker -> Translation logic -> Return result and store in D1/KV -> Update UI via Recoil.
- State Sharing: Sub-components access shared state via Recoil, ensuring real-time updates without direct parent-child communication.
- Deployment Path: Use Wrangler for deploying Cloudflare Workers and associated configurations.

<!-- Initialized by Cline on 5/8/2025 based on projectbrief.md, productContext.md, and activeContext.md. -->
