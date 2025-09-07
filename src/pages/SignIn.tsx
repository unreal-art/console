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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Copy,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "@/components/Layout"
import { useApi } from "@/lib/ApiContext"
import { getPublicClient } from "@/config/wallet"
import { getAddress, formatUnits } from "viem"
import { getChainById } from "@utils/web3/chains"
import { getConfiguredChains, switchChain } from "@/lib/onboard"
import { walletService } from "@/lib/api"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

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

function getTokensForChainHex(
  hexId: string
): Array<{ address: `0x${string}`; label: string }> {
  try {
    const id = parseInt(hexId.replace(/^0x/, ""), 16)
    const chain = getChainById(id) as unknown as {
      custom?: { tokens?: Record<string, ChainToken> }
    }
    const tokens = chain?.custom?.tokens || {}
    return Object.entries(tokens).map(([key, t]) => ({
      address: t.address,
      label: t.symbol || t.name || key,
    }))
  } catch (_) {
    return []
  }
}

const SignIn = () => {
  const navigate = useNavigate()
  const {
    isAuthenticated,
    isLoading: apiLoading,
    error: apiError,
    registerWithWallet,
    connectWallet,
    clearError,
    getCurrentChainId,
    walletAddress,
  } = useApi()

  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [unrealBalance, setUnrealBalance] = useState<string>("0")
  const [unrealBalanceWei, setUnrealBalanceWei] = useState<bigint>(0n)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [chains, setChains] = useState(getConfiguredChains())
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<
    Array<{ address: `0x${string}`; label: string }>
  >([])
  const [selectedToken, setSelectedToken] = useState<`0x${string}` | null>(null)

  const { toast } = useToast()

  const formatAddress = useCallback((addr?: string | null) => {
    if (!addr) return ""
    if (addr.length <= 12) return addr
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }, [])

  const copyToClipboard = useCallback(
    async (text?: string | null) => {
      if (!text) return
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          const ta = document.createElement("textarea")
          ta.value = text
          ta.style.position = "fixed"
          ta.style.left = "-9999px"
          document.body.appendChild(ta)
          ta.focus()
          ta.select()
          document.execCommand("copy")
          document.body.removeChild(ta)
        }
        toast({ description: "Wallet address copied" })
      } catch (e) {
        toast({ description: "Failed to copy address" })
      }
    },
    [toast]
  )

  // Fetch UNREAL token balance - wrapped in useCallback to prevent dependency changes
  const fetchUnrealBalance = useCallback(
    async (address?: string, tokenAddress?: `0x${string}`) => {
      const addr = address ?? walletAddress ?? undefined
      const tokenAddr = tokenAddress ?? selectedToken ?? undefined
      if (!addr || !tokenAddr) return

      setIsLoadingBalance(true)
      try {
        // Get current chain ID from wallet
        const chainId = await getCurrentChainId()
        const publicClient = getPublicClient(chainId)
        const balance = await publicClient.readContract({
          address: getAddress(tokenAddr),
          abi: UNREAL_TOKEN_ABI,
          functionName: "balanceOf",
          args: [getAddress(addr as `0x${string}`)],
        })

        // Preserve precision: keep raw BigInt and a formatted string (18 decimals)
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
    },
    [getCurrentChainId, walletAddress, selectedToken]
  )

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!apiLoading && isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, apiLoading, navigate])

  // Fetch balance when walletAddress becomes available (no auto-connect here to avoid loops)
  useEffect(() => {
    if (walletAddress) {
      void fetchUnrealBalance()
    } else {
      setUnrealBalance("0")
      setUnrealBalanceWei(0n)
    }
  }, [walletAddress, fetchUnrealBalance])

  // Refresh chains after wallet connects, but do NOT auto-select a network
  useEffect(() => {
    if (walletAddress) {
      setChains(getConfiguredChains())
      // Keep selectedChainId null to require manual selection
    } else {
      setSelectedChainId(null)
      setSelectedToken(null)
      setAvailableTokens([])
    }
  }, [walletAddress])

  // When a network is selected, populate available tokens and auto-select the first
  useEffect(() => {
    if (selectedChainId) {
      const tokens = getTokensForChainHex(selectedChainId)
      setAvailableTokens(tokens)
      const first = tokens[0]?.address
      if (first) {
        setSelectedToken(first)
        // Fetch balance for the first token immediately
        void fetchUnrealBalance(undefined, first)
      } else {
        setSelectedToken(null)
        setUnrealBalance("0")
        setUnrealBalanceWei(0n)
      }
    }
  }, [selectedChainId, fetchUnrealBalance])

  // Format a decimal string safely without converting to Number (avoids precision loss)
  const formatBalance = (s: string, decimals = 2) => {
    try {
      if (!s) return decimals > 0 ? `0.${"0".repeat(decimals)}` : "0"
      const [intPart, fracPart = ""] = s.split(".")
      if (decimals <= 0) return intPart
      const trimmed = fracPart.slice(0, decimals)
      const padded = trimmed.padEnd(decimals, "0")
      return `${intPart}.${padded}`
    } catch {
      return s
    }
  }

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      await connectWallet()
    } catch (err) {
      console.error("Error connecting wallet:", err)
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle wallet disconnect
  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true)
    try {
      await walletService.disconnect()
    } catch (err) {
      console.warn("Error disconnecting wallet:", err)
    } finally {
      setIsDisconnecting(false)
    }
  }

  // Handle sign in (register wallet)
  const handleSignIn = async () => {
    setIsRegistering(true)
    try {
      // Always hydrate wallet service; connectWallet will not prompt if already connected
      const addr = walletAddress ?? (await connectWallet())
      if (!addr) throw new Error("Wallet not connected")
      console.debug("[SignIn] Registering with wallet:", addr)

      // Use the actual UNREAL balance for the calls value
      // Compute as whole-token units from raw wei using BigInt to avoid precision loss
      const wholeTokens = unrealBalanceWei / 10n ** 18n
      const callsValue =
        wholeTokens > BigInt(Number.MAX_SAFE_INTEGER)
          ? Number.MAX_SAFE_INTEGER
          : Number(wholeTokens)

      // Now register with the connected wallet
      await registerWithWallet(callsValue)
      setShowOnboarding(true)
    } catch (error) {
      console.error("Error registering wallet:", error)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleChainChange = async (value: string) => {
    setIsSwitchingChain(true)
    try {
      await switchChain(value)
      setSelectedChainId(value.toLowerCase())
      // Clear token selection and balance until user picks a token
      setSelectedToken(null)
      setUnrealBalance("0")
      setUnrealBalanceWei(0n)
    } catch (e) {
      console.warn("Failed to switch chain", e)
    } finally {
      setIsSwitchingChain(false)
    }
  }

  const handleTokenChange = async (value: string) => {
    const token = getAddress(value)
    setSelectedToken(token as `0x${string}`)
    // fetch balance for the chosen token
    await fetchUnrealBalance(undefined, token as `0x${string}`)
  }

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    navigate("/dashboard")
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-14rem)]">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Connect Your Wallet
              </CardTitle>
              <CardDescription>
                Connect your Ethereum wallet to sign in to Unreal Console
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {apiError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{apiError}</AlertDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearError()}
                    className="ml-auto"
                  >
                    Dismiss
                  </Button>
                </Alert>
              )}

              {!walletAddress ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Wallet"
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-sm text-muted-foreground truncate max-w-[240px] hover:underline"
                            title={walletAddress ?? undefined}
                            onClick={() => copyToClipboard(walletAddress)}
                          >
                            {formatAddress(walletAddress)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="font-mono text-xs">
                            {walletAddress}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Disconnect wallet"
                        title="Disconnect"
                        onClick={handleDisconnectWallet}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        <span className="sr-only">Disconnect</span>
                      </Button>
                    </div>
                  </div>

                  {/* Step: Select Network */}
                  {chains.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">Select Network</p>
                        {isSwitchingChain && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                      <Select
                        value={
                          (selectedChainId ?? undefined) as string | undefined
                        }
                        onValueChange={handleChainChange}
                        disabled={!walletAddress || isSwitchingChain}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a network" />
                        </SelectTrigger>
                        <SelectContent>
                          {chains.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Step: Select Payment Token (after network is chosen) */}
                  {selectedChainId && (
                    <div className="p-4 border rounded-lg">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">Select Payment Token</p>
                      </div>
                      <Select
                        value={
                          (selectedToken ?? undefined) as string | undefined
                        }
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

                  {selectedToken && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium">UNREAL Token Balance</p>
                        {isLoadingBalance && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                      <p className="text-2xl font-bold">
                        {isLoadingBalance
                          ? "..."
                          : formatBalance(unrealBalance, 2)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This balance will be used for your registration
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSignIn}
                    disabled={
                      isRegistering ||
                      apiLoading ||
                      isSwitchingChain ||
                      !selectedChainId ||
                      !selectedToken
                    }
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

      {/* Onboarding dialog - placeholder, would typically be a separate component */}
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

export default SignIn
