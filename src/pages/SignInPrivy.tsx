import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertCircle, Loader2, CheckCircle, Wallet } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "@/components/Layout"
import { useApi } from "@/lib/ApiContext"
import { usePrivy, useWallets, useLogin } from "@/lib/privyHooks"
import type { ConnectedWallet } from "@privy-io/react-auth"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { walletService } from "@/lib/api"
import { getPublicClient } from "@/config/wallet"
import { getAddress, formatUnits, toHex } from "viem"
import { getChainById } from "@utils/web3/chains"
import { torusMainnet, amoyTestnet, titanAITestnet } from "@/config/wallet"

// Define the minimal ABI for the UNREAL token to fetch balance
const UNREAL_TOKEN_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

type ChainToken = { address: `0x${string}`; symbol?: string; name?: string }

// Available chains configuration
const AVAILABLE_CHAINS = [
  { id: torusMainnet.id, name: torusMainnet.name, hex: toHex(torusMainnet.id) },
  { id: amoyTestnet.id, name: amoyTestnet.name, hex: toHex(amoyTestnet.id) },
  { id: titanAITestnet.id, name: titanAITestnet.name, hex: toHex(titanAITestnet.id) },
]

function getTokensForChainId(chainId: number): Array<{ address: `0x${string}`; label: string }> {
  try {
    const chain = getChainById(chainId) as unknown as { custom?: { tokens?: Record<string, ChainToken> } }
    const tokens = chain?.custom?.tokens || {}
    return Object.entries(tokens).map(([key, t]) => ({
      address: t.address,
      label: t.symbol || t.name || key,
    }))
  } catch (_) {
    return []
  }
}

const SignInPrivy = () => {
  const navigate = useNavigate()
  const { 
    isAuthenticated, 
    isLoading: apiLoading, 
    error: apiError, 
    registerWithWallet, 
    clearError 
  } = useApi()
  
  // Privy hooks
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { login } = useLogin({
    onComplete: ({ user, isNewUser }) => {
      console.log('Privy login complete:', { user, isNewUser })
      if (wallets.length > 0) {
        handleWalletConnected(wallets[0])
      }
    },
    onError: (error) => {
      console.error('Privy login error:', error)
      setError('Failed to connect wallet. Please try again.')
    }
  })

  const [isConnecting, setIsConnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [unrealBalance, setUnrealBalance] = useState<string>("0")
  const [unrealBalanceWei, setUnrealBalanceWei] = useState<bigint>(0n)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<Array<{ address: `0x${string}`; label: string }>>([])
  const [selectedToken, setSelectedToken] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Wagmi account/chain (RainbowKit)
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const wagmiChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  // Check if already authenticated and redirect
  useEffect(() => {
    if (isAuthenticated && !apiLoading) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, apiLoading, navigate])

  // Update wallet address when Privy wallet changes
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      const wallet = wallets[0]
      setWalletAddress(wallet.address)
      
      // Get current chain from wallet
      const chainIdHex = wallet.chainId
      const chainId = parseInt(chainIdHex.replace('0x', ''), 16)
      setSelectedChainId(chainId)
      
      // Update available tokens for the chain
      const tokens = getTokensForChainId(chainId)
      setAvailableTokens(tokens)
      if (tokens.length > 0 && !selectedToken) {
        setSelectedToken(tokens[0].address)
      }
    }
  }, [authenticated, wallets, selectedToken])

  // Hydrate wallet service when RainbowKit connects
  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      // hydrate walletService from window provider
      walletService
        .connectFromWindow()
        .then(() => {
          setWalletAddress(wagmiAddress)
          if (wagmiChainId) {
            setSelectedChainId(wagmiChainId)
            const tokens = getTokensForChainId(wagmiChainId)
            setAvailableTokens(tokens)
            if (tokens.length > 0 && !selectedToken) {
              setSelectedToken(tokens[0].address)
            }
          }
        })
        .catch((e) => console.warn("walletService.connectFromWindow failed", e))
    }
  }, [wagmiConnected, wagmiAddress, wagmiChainId, selectedToken])

  // Fetch UNREAL token balance
  const fetchUnrealBalance = useCallback(async (address?: string, tokenAddress?: `0x${string}`, chainId?: number) => {
    const addr = address ?? walletAddress ?? undefined
    const tokenAddr = tokenAddress ?? selectedToken ?? undefined
    const chain = chainId ?? selectedChainId ?? undefined
    
    if (!addr || !tokenAddr || !chain) return

    setIsLoadingBalance(true)
    try {
      const publicClient = getPublicClient(chain)
      const balance = await publicClient.readContract({
        address: getAddress(tokenAddr),
        abi: UNREAL_TOKEN_ABI,
        functionName: "balanceOf",
        args: [getAddress(addr as `0x${string}`)],
      })

      setUnrealBalanceWei(balance as bigint)
      const formatted = formatUnits(balance as bigint, 18)
      setUnrealBalance(formatted)
    } catch (err) {
      console.error("Error fetching UNREAL balance:", err)
      setUnrealBalance("0")
      setUnrealBalanceWei(0n)
    } finally {
      setIsLoadingBalance(false)
    }
  }, [walletAddress, selectedToken, selectedChainId])

  // Fetch balance when token or wallet changes
  useEffect(() => {
    if (walletAddress && selectedToken && selectedChainId) {
      void fetchUnrealBalance()
    }
  }, [walletAddress, selectedToken, selectedChainId, fetchUnrealBalance])

  // Format balance for display
  const formatBalance = (s: string, decimals = 2) => {
    const [whole, frac] = s.split(".")
    if (!frac) return whole
    const truncated = frac.slice(0, decimals)
    return truncated === "00" ? whole : `${whole}.${truncated}`
  }

  // Handle wallet connection through Privy
  const handleConnectWallet = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      // Privy login will trigger the onComplete callback
      await login()
    } catch (err) {
      console.error("Error connecting wallet:", err)
      setError("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle wallet connected callback
  const handleWalletConnected = async (wallet: ConnectedWallet) => {
    try {
      const provider = await wallet.getEthereumProvider()
      await walletService.hydrateFromProvider(provider, wallet.address as `0x${string}`)
      setWalletAddress(wallet.address)
    } catch (err) {
      console.error("Error initializing wallet service:", err)
    }
  }

  // Handle sign in (register wallet)
  const handleSignIn = async () => {
    if (!walletAddress || unrealBalanceWei === 0n) {
      setError("Insufficient UNREAL balance for registration")
      return
    }

    setIsRegistering(true)
    setError(null)
    clearError()

    try {
      // Calculate calls based on balance (1 UNREAL = 1000 calls)
      const calls = Math.floor(Number(formatUnits(unrealBalanceWei, 18)) * 1000)
      
      if (calls < 1) {
        throw new Error("Insufficient UNREAL balance for registration")
      }

      // Register with the calculated calls
      await registerWithWallet(calls)
      
      // Show onboarding on successful registration
      setShowOnboarding(true)
    } catch (err) {
      console.error("Registration error:", err)
      const message = err instanceof Error ? err.message : "Registration failed"
      setError(message)
    } finally {
      setIsRegistering(false)
    }
  }

  // Handle chain change
  const handleChainChange = async (chainIdStr: string) => {
    const chainId = parseInt(chainIdStr)
    setSelectedChainId(chainId)
    setIsSwitchingChain(true)
    setError(null)

    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId })
        // Rehydrate walletService after switch
        await walletService.connectFromWindow()
      }
      
      // Update tokens for new chain
      const tokens = getTokensForChainId(chainId)
      setAvailableTokens(tokens)
      if (tokens.length > 0) {
        setSelectedToken(tokens[0].address)
      }
    } catch (err) {
      console.error("Error switching chain:", err)
      setError("Failed to switch network. Please try again.")
    } finally {
      setIsSwitchingChain(false)
    }
  }

  // Handle token change
  const handleTokenChange = (value: string) => {
    setSelectedToken(value as `0x${string}`)
  }

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    navigate("/settings")
  }

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In to Unreal Console</CardTitle>
              <CardDescription>
                Connect your wallet to access the console
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {(error || apiError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error || apiError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* RainbowKit Connect */}
                <div className="w-full flex justify-center">
                  <ConnectButton showBalance={false} chainStatus="icon" />
                </div>

                {/* Privy email/social login as an alternative path */}
                {!authenticated && (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={handleConnectWallet}
                    disabled={isConnecting || apiLoading}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>Continue with Email / Google (Privy)</>
                    )}
                  </Button>
                )}

                {(authenticated || wagmiConnected) && (
                <div className="space-y-4">
                  {/* Connected wallet info */}
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">Connected Wallet</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {walletAddress}
                    </p>
                  </div>

                  {/* Network selection */}
                  <div className="p-4 border rounded-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">Select Network</p>
                      {isSwitchingChain && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    <Select
                      value={selectedChainId?.toString()}
                      onValueChange={handleChainChange}
                      disabled={isSwitchingChain}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a network" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_CHAINS.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id.toString()}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Token selection */}
                  {selectedChainId && availableTokens.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="mb-2">
                        <p className="font-medium">Select Payment Token</p>
                      </div>
                      <Select
                        value={selectedToken ?? undefined}
                        onValueChange={handleTokenChange}
                        disabled={!walletAddress || !selectedChainId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a payment token" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTokens.map((t) => (
                            <SelectItem key={t.address} value={t.address}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Balance display */}
                  {selectedToken && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium">UNREAL Token Balance</p>
                        {isLoadingBalance && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                      <p className="text-2xl font-bold">
                        {isLoadingBalance ? "..." : formatBalance(unrealBalance, 2)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This balance will be used for your registration
                      </p>
                    </div>
                  )}

                  {/* Sign in button */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSignIn}
                    disabled={isRegistering || apiLoading || isSwitchingChain || !selectedChainId || !selectedToken}
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In with Wallet"
                    )}
                  </Button>
                </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                By connecting your wallet, you agree to the Terms of Service and
                Privacy Policy
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Onboarding dialog */}
      {showOnboarding && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Welcome to Unreal Console!</DialogTitle>
              <DialogDescription>
                Your wallet has been successfully registered.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                You're all set to start using the Unreal Console.
              </p>

              <Button
                className="w-full"
                size="lg"
                onClick={handleOnboardingComplete}
              >
                Go to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  )
}

export default SignInPrivy
