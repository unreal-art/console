import injectedWallets from "@web3-onboard/injected-wallets"
import Onboard, { type OnboardAPI, type WalletState } from "@web3-onboard/core"
import coinbaseModule from "@web3-onboard/coinbase"
import walletConnectModule from "@web3-onboard/walletconnect"
import magicModule from "@web3-onboard/magic"
import ledgerModule from "@web3-onboard/ledger"
import trezorModule from "@web3-onboard/trezor"
import sequenceModule from "@web3-onboard/sequence"
import tahoModule from "@web3-onboard/taho"
import dcentModule from "@web3-onboard/dcent"
import keystoneModule from "@web3-onboard/keystone"
import safeModule from "@web3-onboard/gnosis"
import okxModule from "@web3-onboard/okx"
import infinityWalletModule from "@web3-onboard/infinity-wallet"
import trustModule from "@web3-onboard/trust"
import frontierModule from "@web3-onboard/frontier"
import keepkeyModule from "@web3-onboard/keepkey"
import { toHex, type EIP1193Provider } from "viem"
import { torusMainnet, amoyTestnet, titanAITestnet } from "@/config/wallet"
import { getUnrealTokenAddress } from "@utils/web3/chains"

// Minimal chain type for web3-onboard
export type OnboardChain = {
  id: string // hex string e.g. '0x1'
  token: string // native token symbol
  label: string // human-readable name
  rpcUrl: string
  // Optional list of ERC-20 tokens to show alongside native token
  // Matches Web3-Onboard Chain.secondaryTokens shape
  secondaryTokens?: { address: string; icon?: string }[]
}

export const DEFAULT_CHAINS: OnboardChain[] = [
  {
    id: toHex(torusMainnet.id), // 8192
    token: torusMainnet.nativeCurrency.symbol,
    label: torusMainnet.name,
    rpcUrl: torusMainnet.rpcUrls.default.http[0],
    secondaryTokens: [{ address: getUnrealTokenAddress(torusMainnet.id) }],
  },
  {
    id: toHex(titanAITestnet.id), // 8192
    token: titanAITestnet.nativeCurrency.symbol,
    label: titanAITestnet.name,
    rpcUrl: titanAITestnet.rpcUrls.default.http[0],
    secondaryTokens: [{ address: getUnrealTokenAddress(titanAITestnet.id) }],
  },
  {
    id: toHex(amoyTestnet.id), // 8192
    token: amoyTestnet.nativeCurrency.symbol,
    label: amoyTestnet.name,
    rpcUrl: amoyTestnet.rpcUrls.default.http[0],
    secondaryTokens: [{ address: getUnrealTokenAddress(amoyTestnet.id) }],
  },
  // Add more defaults here if desired, e.g. Ethereum mainnet
  // { id: '0x1', token: 'ETH', label: 'Ethereum Mainnet', rpcUrl: 'https://rpc.ankr.com/eth' }
]

let onboardInstance: OnboardAPI | null = null
let configuredChains: OnboardChain[] = DEFAULT_CHAINS

import logo from "@public/favicon.ico"

const appMetadata = {
  name: "Unreal Console",
  icon: logo,
  logo: logo,
  description: "Multi-chain wallet for Unreal Console",
  recommendedInjectedWallets: [
    { name: "MetaMask", url: "https://metamask.io" },
    { name: "Coinbase", url: "https://wallet.coinbase.com/" },
    { name: "Phantom", url: "https://phantom.app/" },
  ],
}
export function initOnboard(chains?: OnboardChain[]) {
  if (chains && chains.length > 0) configuredChains = chains
  if (!onboardInstance) {
    // Initialize as many wallet options as possible (custodial-friendly + popular HW/injected)
    const injected = injectedWallets()
    const coinbase = coinbaseModule()
    // Initialize WalletConnect only if Project ID is present
    let walletConnect: ReturnType<typeof walletConnectModule> | null = null
    if (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
      walletConnect = walletConnectModule({
        // Use WalletConnect Cloud Project ID
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      })
    }
    const magic = magicModule({
      apiKey: import.meta.env.VITE_MAGIC_API_KEY || "",
    })
    const ledger = ledgerModule({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      walletConnectVersion: 2,
      // requiredChains: configuredChains.map((c) => c.id),
    })
    const trezor = trezorModule({
      appUrl:
        import.meta.env.VITE_TREZOR_APP_URL || "https://console.unreal.art",
      email: import.meta.env.VITE_TREZOR_EMAIL || "team@unreal.art",
    })
    const sequence = sequenceModule()
    const taho = tahoModule()
    const dcent = dcentModule()
    const keystone = keystoneModule()
    const safe = safeModule()
    const okx = okxModule()
    const infinityWallet = infinityWalletModule()
    const trust = trustModule()
    const frontier = frontierModule()
    const keepkey = keepkeyModule()

    const wallets = [
      injected,
      coinbase,
      keepkey,
      okx,
      sequence,
      trust,
      frontier,
      taho,
      ledger,
      dcent,
      trezor,
      safe,
      // keystone,//FIXME: buffer not defined
      // infinityWallet,//FIXME: deprecated
    ]

    // Conditionally add SDK-keyed wallets
    if (walletConnect) wallets.push(walletConnect)
    if (import.meta.env.VITE_MAGIC_API_KEY) {
      wallets.push(magic)
    }
    onboardInstance = Onboard({
      wallets,
      chains: configuredChains,
      appMetadata,
    })
  }
  return onboardInstance
}

export function getOnboard() {
  return initOnboard() as OnboardAPI
}

export function getConfiguredChains(): OnboardChain[] {
  return configuredChains
}

// Allow consumers to drop the current Onboard instance so the next call
// to getOnboard() re-initializes without any cached connection state.
export function resetOnboard() {
  onboardInstance = null
}

export async function switchChain(chainIdHex: string): Promise<void> {
  const onboard = getOnboard()
  try {
    await onboard.setChain({ chainId: chainIdHex })
    // Persist last successful chain selection
    try {
      localStorage.setItem("unreal_last_chain", chainIdHex.toLowerCase())
    } catch (_) {
      // ignore persistence errors
    }
  } catch (e) {
    // If setChain is not available or fails, fall back to EIP-3326 via provider if connected
    try {
      const wallets = (onboard.state.get().wallets || []) as WalletState[]
      const first = wallets && wallets[0]
      const provider = first?.provider as unknown as EIP1193Provider | undefined
      if (provider?.request) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
          })
          try {
            localStorage.setItem("unreal_last_chain", chainIdHex.toLowerCase())
          } catch (_) {
            // ignore
          }
          return
        } catch (switchErr: unknown) {
          // If the chain has not been added to the wallet, attempt to add it
          const errObj = switchErr as {
            code?: number
            data?: { originalError?: { code?: number } }
            message?: string
          }
          const code = errObj?.code ?? errObj?.data?.originalError?.code
          const msg: string = (errObj?.message || "").toLowerCase()
          const needsAdd =
            code === 4902 ||
            msg.includes("unrecognized chain") ||
            msg.includes("add ethereum chain")
          if (needsAdd) {
            const target = (configuredChains || []).find(
              (c) => c.id.toLowerCase() === chainIdHex.toLowerCase()
            )
            if (target) {
              try {
                await provider.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: target.id,
                      chainName: target.label,
                      nativeCurrency: {
                        name: target.token,
                        symbol: target.token,
                        decimals: 18,
                      },
                      rpcUrls: [target.rpcUrl],
                      // Block explorer optional; omit if unknown
                      blockExplorerUrls: [],
                    },
                  ],
                })
                // Try switching again after adding
                await provider.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: chainIdHex }],
                })
                try {
                  localStorage.setItem(
                    "unreal_last_chain",
                    chainIdHex.toLowerCase()
                  )
                } catch (_) {
                  // ignore
                }
                return
              } catch (addErr) {
                console.warn("wallet_addEthereumChain failed:", addErr)
              }
            } else {
              console.warn(
                "Target chain details not found in configuredChains for",
                chainIdHex
              )
            }
          }
          // If we get here, rethrow the original switch error
          throw errObj
        }
      }
    } catch (err) {
      console.warn("switchChain fallback error:", err)
    }
  }
}
