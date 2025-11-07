---
"unreal-console": minor
---

refactor: chain configuration and integrate Blockscout

- Create src/config/viem.ts to centralize chain definitions
- Refactor src/config/wallet.ts to import chains from viem.ts
- Create src/config/blockscout.ts with Blockscout SDK configuration
- Update utils/web3/chains.ts to import from @/config/viem
- Add Blockscout helpers for explorer URLs and API integration
