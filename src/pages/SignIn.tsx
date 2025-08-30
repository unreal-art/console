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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AlertCircle, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "@/components/Layout"
import { useApi } from "@/lib/ApiContext"
import { getPublicClient } from "@/config/wallet"
import { getAddress } from "viem"

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
  const {
    isAuthenticated,
    isLoading: apiLoading,
    error: apiError,
    registerWithWallet,
    connectWallet,
    clearError,
    getCurrentChainId,
  } = useApi()

  const [walletAddresses, setWalletAddresses] = useState<string[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [unrealBalance, setUnrealBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Fetch UNREAL token balance - wrapped in useCallback to prevent dependency changes
  const fetchUnrealBalance = useCallback(async (address: string) => {
    if (!address) return

    setIsLoadingBalance(true)
    try {
      // Get current chain ID from wallet
      const chainId = await getCurrentChainId()
      const publicClient = getPublicClient(chainId)
      const balance = await publicClient.readContract({
        address: UNREAL_TOKEN_ADDRESS,
        abi: UNREAL_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
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
  }, [getCurrentChainId])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!apiLoading && isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, apiLoading, navigate])

  // Get available wallet addresses - wrapped in useCallback to prevent dependency changes on every render
  const getConnectedWallets = useCallback(async () => {
    try {
      // Check if window.ethereum exists
      if (window.ethereum) {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
          params: [],
        })) as string[]
        if (accounts && accounts.length > 0) {
          setWalletAddresses(accounts as string[])
          // If we have a wallet address but no selected address, set the first one
          if (!selectedAddress && accounts.length > 0) {
            setSelectedAddress(accounts[0] as string)
            // Fetch unreal balance for the first account
            fetchUnrealBalance(accounts[0] as string)
          }
        }
      }
    } catch (err) {
      console.error("Error getting connected wallets:", err)
    }
  }, [selectedAddress, fetchUnrealBalance])

  // Check for connected wallets on load
  useEffect(() => {
    getConnectedWallets()

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddresses(accounts)
        setSelectedAddress(accounts[0])
        fetchUnrealBalance(accounts[0])
      } else {
        setWalletAddresses([])
        setSelectedAddress(null)
        setUnrealBalance(0)
      }
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [getConnectedWallets, fetchUnrealBalance])

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts", params: [] })
        await getConnectedWallets()
        setShowWalletModal(true)
      } else {
        alert("Please install a Web3 wallet like MetaMask to connect")
      }
    } catch (err) {
      console.error("Error connecting wallet:", err)
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle wallet selection from modal
  const handleSelectWallet = async (address: string) => {
    // Just update the selected address and fetch balance
    // No need to call connectWallet since wallet is already connected
    console.debug("[SignIn] Switching to wallet address:", address)
    setSelectedAddress(address)
    await fetchUnrealBalance(address)
    setShowWalletModal(false)
  }

  // Handle sign in (register wallet)
  const handleSignIn = async () => {
    if (!selectedAddress) return

    setIsRegistering(true)
    try {
      // Connect wallet only if needed, but avoid showing onboarding modal
      // Check if wallet is already connected in ApiContext
      console.debug("[SignIn] Registering with wallet:", selectedAddress)
      
      // Ensure wallet is connected in ApiContext before registration
      await connectWallet(selectedAddress)
      
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

              {!selectedAddress ? (
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
                        {selectedAddress}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowWalletModal(true)}
                    >
                      Switch
                    </Button>
                  </div>

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
                    disabled={isRegistering || apiLoading}
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

      {/* Wallet selection modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Wallet</DialogTitle>
            <DialogDescription>
              Choose which connected wallet to use for sign in
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {walletAddresses.length > 0 ? (
              walletAddresses.map((address) => (
                <Button
                  key={address}
                  variant={address === selectedAddress ? "default" : "outline"}
                  className="w-full justify-start py-6 mb-2"
                  onClick={() => handleSelectWallet(address)}
                >
                  <div className="flex items-center">
                    {address === selectedAddress && (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    )}
                    <span className="truncate">{address}</span>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p>No wallets connected</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setShowWalletModal(false)
                    handleConnectWallet()
                  }}
                >
                  Connect Wallet
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
