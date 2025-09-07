import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth"
import { ReactNode } from "react"

// Privy App ID - You'll need to get this from your Privy dashboard
// For development, you can use a test app ID
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID

// Minimal config for Privy (advanced EVM config can be layered with @privy-io/wagmi if needed)

interface PrivyWrapperProps {
  children: ReactNode
}

export function PrivyWrapper({ children }: PrivyWrapperProps) {
  // If no Privy App ID is configured, render children without the provider to avoid runtime errors.
  if (!PRIVY_APP_ID) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Privy] VITE_PRIVY_APP_ID not set; rendering without PrivyProvider"
      )
    }
    return <>{children}</>
  }

  // Optional WalletConnect Project ID
  const WALLETCONNECT_ID = (
    import.meta as unknown as { env: Record<string, string | undefined> }
  ).env?.VITE_WALLETCONNECT_PROJECT_ID

  // Keep config minimal to avoid unsupported fields/runtime issues; advanced EVM integration can be added via @privy-io/wagmi later.
  const config = {
    appearance: {
      theme: 'dark' as const,
      accentColor: '#676FFF' as const,
      logo: '/logo.svg',
      showWalletLoginFirst: true,
    },
    loginMethods: ['wallet', 'email', 'google'] as const,
    embeddedWallets: {
      createOnLogin: 'users-without-wallets' as const,
      requireUserPasswordOnCreate: false,
    },
    ...(WALLETCONNECT_ID ? { walletConnectCloudProjectId: WALLETCONNECT_ID } : {}),
  } satisfies PrivyClientConfig;

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={config}>
      {children}
    </PrivyProvider>
  )
}
