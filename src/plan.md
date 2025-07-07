# Unreal Console API Integration Plan

## Notes

- Unreal console is a plain UI app built with React, Vite, TypeScript, and Shadcn UI components.
- REST APIs for authentication, wallet registration, token verification, and API key management are documented in openai/rest.http.
- API integration will require wallet-based authentication, token handling, and API key creation flows in the UI.
- The main onboarding flow is implemented in the OnboardingFlow component and is the likely integration point for wallet registration and API key creation.
- API service module (src/lib/api.ts) and context provider (src/lib/ApiContext.tsx) have been created to manage API calls and authentication state.
- Use Bun as the package manager and respect bun.lock in the project.
- viem package installed; refactoring wallet integration from ethers.js to viem.
- ethers.js dependency fully removed from codebase and package.json.
- Prefer thirdweb for wallet integration.
- Refactor to a multi-page application (not SPA) for maintainability.
- viem wallet integration refactor complete; focus shifting to removing ethers.js and implementing multi-page structure.
- Multi-page refactor will include creating new pages, updating routing, and implementing shared layout/navigation.
- Shared layout/navigation component and all main pages (Dashboard, Chat, Settings, Login) created and integrated; multi-page routing and onboarding flow integration complete.
- After wallet is connected, UI should display a “Sign In” (register) option; registration should not auto-trigger. Update onboarding/login UI to reflect this two-step process.
- Fix wallet registration/sign-in to show Sign In/register option after wallet connect, including after refresh, and ensure session persistence.
- Fix syntax errors and UI logic in Login page for two-step wallet connection (Connect Wallet, then Sign In).
- Users should be able to connect and switch between multiple wallets; UI must reload on wallet switch.
- SignIn page and route implemented for multi-wallet connect/switch and $UNREAL balance fetch using viem config (no thirdweb).
- Note: Encountered issues installing thirdweb via Bun (integrity check failures, missing versions); wallet connection library integration is currently blocked pending resolution or alternative approach.
- The sign-in flow should redirect to /sign-in, present modals for wallet authorization (thirdweb or web3onboard kit), and after connecting, users can switch wallets; the UI should fetch the $UNREAL token balance for the selected address and set it as "calls" in the registration payload.
- viem configuration is centralized in src/config/viem.ts.
- After sign-in, focus will shift to /dashboard UI for API key CRUD flows.
- UNREAL token address for balance fetch now uses viem's getAddress utility with a valid ERC-20 address (DAI as placeholder until real UNREAL address is provided).
- The registerWithWallet function in ApiContext expects only the calls (number) argument; wallet address is managed internally. All usages now updated accordingly.
- Settings page supports API key creation and display; API client now supports listing and deleting keys for multi-key management.
- API client now includes a DELETE method for API key deletion.
- ApiContext now exposes apiKeys, isLoadingApiKeys, listApiKeys, and deleteApiKey for multi-key management in UI.
- Next UI step: Implement API key deletion and multi-key management (CRUD) in Settings, including error handling for all API key operations.

## Task List

- [x] Review and document all required API endpoints from rest.http
- [x] Analyze Unreal console app structure and dependencies
- [x] Design integration points in the UI for:
  - [x] Wallet login/registration (/auth/register)
  - [x] Token verification (/auth/verify)
  - [x] API key creation (/keys)
  - [x] Chat completion usage (/v1/chat/completions)
- [x] Implement API service module (src/lib/api.ts)
- [x] Implement API context provider (src/lib/ApiContext.tsx)
- [x] Implement wallet login/registration flow in the UI
- [x] Implement token verification and bearer token management
- [x] Implement API key creation UI and logic
- [x] Implement chat completion API usage in the UI
- [x] Test all integrated flows end-to-end
  - [x] Test wallet login/registration flow
  - [x] Test token verification flow
  - [x] Test API key creation and management
  - [x] Test chat completion usage
  - [x] Test navigation and routing between pages
  - [x] Test onboarding flow integration
  - [x] Test/fix wallet registration & sign-in persistence after refresh (two-step process: connect, then sign in)
  - [x] Fix Login page UI and syntax for two-step wallet connection
  - [x] Implement multi-wallet connect/switch UI and reload logic (using viem, not thirdweb)
  - [x] Implement /sign-in flow with wallet connect/switch, $UNREAL balance fetch for registration (no thirdweb modal)
  - [x] Redirect Login page to new /sign-in flow
  - [x] Fix lint warning: wrap getConnectedWallets in useCallback in SignIn.tsx
  - [x] Fix lint warning: wrap fetchUnrealBalance in useCallback in SignIn.tsx
  - [x] Fix function declaration order and useEffect dependencies in SignIn.tsx
  - [ ] Test error handling and edge cases
  - [ ] Implement /dashboard UI for API key CRUD
    - [x] Basic API key display and navigation to Settings exists
    - [x] API key creation and display supported in Settings
    - [x] API client supports API key listing and deletion
    - [ ] Add API key deletion and multi-key management (CRUD) in Settings
    - [ ] Add error handling for all API key operations
- [x] Remove ethers.js dependency
- [x] Refactor app to be a multi-page application (not SPA)
  - [x] Create additional pages for functional areas
  - [x] Set up routing between pages
  - [x] Implement shared layout/navigation component
- [ ] Research/troubleshoot wallet connection library installation issues or consider alternatives

## Current Goal

Implement API key deletion and multi-key support in Settings
