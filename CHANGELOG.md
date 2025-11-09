# unreal-console

## 2.1.0

### Minor Changes

- bbf4b65: refactor: chain configuration and integrate Blockscout

  - Create src/config/viem.ts to centralize chain definitions
  - Refactor src/config/wallet.ts to import chains from viem.ts
  - Create src/config/blockscout.ts with Blockscout SDK configuration
  - Update utils/web3/chains.ts to import from @/config/viem
  - Add Blockscout helpers for explorer URLs and API integration

- 94fef4d: refactor: to react router
- 5adbf75: feat: stream playground
- e2008ac: support :deploy to somnia testnet
- 3ee583a: show pricing and the flow elegantly in the ui

### Patch Changes

- 02933d1: logout user after airdrop
- 2dc2d60: attempt: to stream openai playground chat

## 2.0.1

### Patch Changes

- 010c11a: guided start is overflowing

## 1.0.0

### Major Changes

- 038e803: v2: multi page modern UI application with playground and api key management support

### Minor Changes

- af751cb: Keyboard Maxi for Unreal Console
- 9224e64: support: custodial wallets via thirdweb for web2 users
- cea781a: drop multi wallet support and focus on better ux/dx with simpilicty
- 66fbbf4: Airdrop: campaign to boost our socials
