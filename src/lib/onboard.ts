import injectedWallets from '@web3-onboard/injected-wallets'
import Onboard, { type OnboardAPI, type WalletState } from '@web3-onboard/core'
import { TORUS_RPC } from '@/config/wallet'

// Minimal chain type for web3-onboard
export type OnboardChain = {
  id: string // hex string e.g. '0x1'
  token: string // native token symbol
  label: string // human-readable name
  rpcUrl: string
}

export const DEFAULT_CHAINS: OnboardChain[] = [
  {
    id: '0x2000', // 8192
    token: 'TQF',
    label: 'Torus Mainnet',
    rpcUrl: TORUS_RPC
  }
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
        name: 'Unreal Console',
        description: 'Multi-chain wallet for Unreal Console',
      }
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
  } catch (e) {
    // If setChain is not available or fails, fall back to EIP-3326 via provider if connected
    try {
      const wallets = (onboard.state.get().wallets || []) as WalletState[]
      if (wallets && wallets[0] && (wallets[0] as any).provider?.request) {
        await (wallets[0] as any).provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }]
        })
      }
    } catch (err) {
      console.warn('switchChain fallback error:', err)
    }
  }
}
