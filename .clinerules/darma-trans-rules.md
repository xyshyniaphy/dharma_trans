## Brief overview
This set of guidelines is project-specific for the Darma Trans project, focusing on development practices for Cloudflare workers, React applications, and state management with Recoil.

## Communication style
- Be direct and technical in responses; avoid conversational phrases like "Great" or "Sure".
- Use clear, concise instructions when making changes or suggestions.

## Development workflow
- Use Windows commands for all operations, as the OS is Windows 11.
- Ensure all changes include added comments to explain modifications, without removing existing comments.
- Do not alter useEffect dependencies in React components.
- Develop with awareness of Cloudflare Workers environment, avoiding assumptions about server-side execution.

## Coding best practices
- Use TypeScript for type safety in React components.
- Implement state management with Recoil hooks for sharing states between sub-components.
- Maintain UI elements in Chinese for localization.
- Do not remove any comments
- Add comment for all code create, edit or changes
- Do not generate or modify any regular expressions (regex). The user will provide any necessary regex.

## Project context
- Build applications for Cloudflare Workers, integrating D1 database and KV storage.
- Use React and React-Bootstrap for UI components.
- use wrangler to deploy server and UI to cloudflare workers

## Server Runtime
- Server code run on cloudflare, using cloudflare workers, d1 database, kv

## UI Runtime
- typescript, react, react-bootstrap
- use recoil for state management
