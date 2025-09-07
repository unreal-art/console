import React, { type ReactNode } from 'react'
import { PrivyProvider, type PrivyClientConfig } from '@privy-io/react-auth'
import { WagmiProvider as PrivyWagmiProvider, createConfig as createPrivyWagmiConfig } from '@privy-io/wagmi'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import { CHAINS, pickRpc } from '@/config/wallet'
import { http, type Transport, type Chain } from 'viem'
import { WagmiProvider as BaseWagmiProvider } from 'wagmi'

// Types
interface Props { children: ReactNode }

function buildTransports<T extends readonly [Chain, ...Chain[]]>(chains: T) {
  const map = chains.reduce((acc, c) => {
    // pick one RPC per chain to avoid hitting rate limits
    acc[c.id] = http(pickRpc(c.rpcUrls.default.http))
    return acc
  }, {} as Record<T[number]['id'], Transport>)
  return map
}

export function WalletProviders({ children }: Props) {
  const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined
  const WALLETCONNECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

  // Cast our CHAINS to the tuple type RainbowKit expects
  const chains = CHAINS as unknown as readonly [Chain, ...Chain[]]
  const transports = buildTransports(chains)

  // Prefer RainbowKit's helper when WC Project ID is set
  const wagmiConfig = WALLETCONNECT_ID
    ? getDefaultConfig({
        appName: 'Unreal Console',
        projectId: WALLETCONNECT_ID,
        chains,
        transports,
      })
    : createPrivyWagmiConfig({
        chains,
        transports,
        // No connectors without WC project id; users can still use Privy embedded/social
      })

  // Minimal Privy config (works alongside RainbowKit). Advanced options can be added later.
  const privyConfig: PrivyClientConfig = {
    appearance: {
      theme: 'dark',
      accentColor: '#676FFF',
      logo: '/logo.svg',
      showWalletLoginFirst: true,
    },
    loginMethods: ['wallet', 'email', 'google'],
    embeddedWallets: { createOnLogin: 'users-without-wallets', requireUserPasswordOnCreate: false },
    ...(WALLETCONNECT_ID ? { walletConnectCloudProjectId: WALLETCONNECT_ID } : {}),
  }

  // If Privy App ID not set, fall back to wagmi + RainbowKit only
  if (!PRIVY_APP_ID) {
    return (
      <BaseWagmiProvider config={wagmiConfig}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </BaseWagmiProvider>
    )
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <PrivyWagmiProvider config={wagmiConfig}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </PrivyWagmiProvider>
    </PrivyProvider>
  )
}
