import injectedWallets from "@web3-onboard/injected-wallets"
import Onboard, { type OnboardAPI, type WalletState } from "@web3-onboard/core"
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

export function initOnboard(chains?: OnboardChain[]) {
  if (chains && chains.length > 0) configuredChains = chains
  if (!onboardInstance) {
    const wallets = [injectedWallets()]
    onboardInstance = Onboard({
      wallets,
      chains: configuredChains,
      appMetadata: {
        name: "Unreal Console",
        description: "Multi-chain wallet for Unreal Console",
      },
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
