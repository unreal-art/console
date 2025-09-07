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
import { AlertCircle, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "@/components/Layout"
import { useApi } from "@/lib/ApiContext"
import { getPublicClient } from "@/config/wallet"
import { getAddress } from "viem"
import { getConfiguredChains, switchChain } from "@/lib/onboard"

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

// UNREAL payment token on Torus Mainnet (checksummed)
const UNREAL_TOKEN_ADDRESS = getAddress(
  "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB"
)

const SignIn = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: apiLoading, error: apiError, registerWithWallet, connectWallet, clearError, getCurrentChainId, walletAddress } = useApi()

  const [isConnecting, setIsConnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [unrealBalance, setUnrealBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [chains, setChains] = useState(getConfiguredChains())
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)

  // Fetch UNREAL token balance - wrapped in useCallback to prevent dependency changes
  const fetchUnrealBalance = useCallback(async (address?: string) => {
    const addr = address ?? walletAddress ?? undefined
    if (!addr) return

    setIsLoadingBalance(true)
    try {
      // Get current chain ID from wallet
      const chainId = await getCurrentChainId()
      const publicClient = getPublicClient(chainId)
      const balance = await publicClient.readContract({
        address: UNREAL_TOKEN_ADDRESS,
        abi: UNREAL_TOKEN_ABI,
        functionName: "balanceOf",
        args: [addr],
      })

      // Convert to number for simplicity
      // In production, you might want to handle BigInt properly
      const balanceNumber = Number(balance) / 10 ** 18 // Assuming 18 decimals
      setUnrealBalance(balanceNumber)
    } catch (err) {
      console.error("Error fetching UNREAL balance:", err)
      setUnrealBalance(0)
    } finally {
      setIsLoadingBalance(false)
    }
  }, [getCurrentChainId, walletAddress])

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
      setUnrealBalance(0)
    }
  }, [walletAddress, fetchUnrealBalance])

  // Refresh chains after wallet connects, but do NOT auto-select a network
  useEffect(() => {
    if (walletAddress) {
      setChains(getConfiguredChains())
      // Keep selectedChainId null to require manual selection
    } else {
      setSelectedChainId(null)
    }
  }, [walletAddress])

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

  // Handle sign in (register wallet)
  const handleSignIn = async () => {
    setIsRegistering(true)
    try {
      // Always hydrate wallet service; connectWallet will not prompt if already connected
      const addr = walletAddress ?? (await connectWallet())
      if (!addr) throw new Error("Wallet not connected")
      console.debug("[SignIn] Registering with wallet:", addr)
      
      // Use the actual UNREAL balance for the calls value
      const callsValue = unrealBalance > 0 ? Math.floor(unrealBalance) : 0

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
      // refresh balance on new chain
      await fetchUnrealBalance()
    } catch (e) {
      console.warn("Failed to switch chain", e)
    } finally {
      setIsSwitchingChain(false)
    }
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
                    <div>
                      <p className="font-medium">Connected Wallet</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[240px]">
                        {walletAddress}
                      </p>
                    </div>
                  </div>

                  {/* Step: Select Network */}
                  {chains.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">Select Network</p>
                        {isSwitchingChain && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <Select
                        value={(selectedChainId ?? undefined) as string | undefined}
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

                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between mb-2">
                      <p className="font-medium">UNREAL Token Balance</p>
                      {isLoadingBalance && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">
                      {isLoadingBalance ? "..." : unrealBalance.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This balance will be used for your registration
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSignIn}
                    disabled={isRegistering || apiLoading || isSwitchingChain || !selectedChainId}
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
