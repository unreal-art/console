import {
  createNonceManager,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  WalletClient,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

// -------- Chain / RPC configuration --------
export const TORUS_RPC = "https://rpc.toruschain.com/"

export const torusMainnet = defineChain({
  id: 8192,
  name: "Torus Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Torus Ether",
    symbol: "TQF",
  },
  rpcUrls: {
    default: { http: [TORUS_RPC] },
  },
  blockExplorers: {
    default: { name: "Torus Explorer", url: "https://toruscan.com" },
  },
  testnet: false,
})

export const publicClient = createPublicClient({
  chain: torusMainnet,
  transport: http(TORUS_RPC),
})
