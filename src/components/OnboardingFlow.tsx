import React, { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api"
import { getUnrealBalance } from "@utils/web3/unreal"
import { formatEther, type Address } from "viem"
import { useApi } from "@/lib/ApiContext"
import { toast, useToast } from "@/components/ui/use-toast"
import { getPublicClient } from "@/config/wallet"
import { motion } from "framer-motion"
import {
  Check,
  Wallet,
  FileText,
  Key,
  ArrowRight,
  Copy,
  AlertCircle,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface OnboardingFlowProps {
  onComplete?: () => void
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Use API context
  const {
    isAuthenticated,
    isLoading: apiLoading,
    error: apiError,
    walletAddress,
    token,
    verifyData,
    connectWallet,
    registerWithWallet,
    createApiKey,
    clearApiKey,
    apiKey,
    apiKeyHash,
    getCurrentChainId,
  } = useApi()

  // State for calls amount (number of API calls user can make based on UNREAL balance)
  const [callsAmount, setCallsAmount] = useState<number>(0)
  const [airdropRequested, setAirdropRequested] = useState<boolean>(false)
  const [airdropSuccess, setAirdropSuccess] = useState<boolean>(false)
  const [airdropTxHash, setAirdropTxHash] = useState<string>("")
  const [isConfirming, setIsConfirming] = useState<boolean>(false)
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)

  // Timer state for tracking confirmation time
  const [confirmationStartTime, setConfirmationStartTime] = useState<
    number | null
  >(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  // Single wallet flow: no multi-address selection UI

  const fetchCallsAmount = useCallback(async () => {
    console.log("fetchCallsAmount")
    try {
      // Use the current wallet address from context, which is now correctly set to the selected address
      if (!walletAddress) return

      // 1. Get payment token from system info
      const systemInfo = await apiClient.getSystemInfo()
      console.log("systemInfo", systemInfo)
      const paymentToken = systemInfo.paymentTokens[0] as Address
      if (!paymentToken) {
        console.error("Payment token not available from system info")
        return
      }

      // 2. Get UNREAL balance for the wallet
      // This will now use the selected wallet address from the dropdown
      const balance = await getUnrealBalance(
        paymentToken,
        walletAddress as `0x${string}`
      )
      const balanceInEther = formatEther(balance)
      const calls = Number(balanceInEther)
      console.log("calls=", calls)

      setCallsAmount(calls)

      // Set showAirdropStep based on balance
      // Only show airdrop step if balance is 0
      setShowAirdropStep(calls === 0)

      // Do not persist calls to localStorage; keep in-memory only per app policy
      console.debug(
        "OnboardingFlow: callsAmount computed (not persisted)",
        calls
      )
    } catch (err) {
      console.error("Unable to fetch calls amount:", err)
    }
  }, [walletAddress])

  // Fetch calls amount similar to cockpit registration logic
  useEffect(() => {
    fetchCallsAmount()
  }, [walletAddress, fetchCallsAmount])

  // State to track if this is a zero-balance registration
  const [isZeroBalanceRegistration, setIsZeroBalanceRegistration] =
    useState<boolean>(false)

  // State to control whether to show the airdrop step (only shown when balance is 0)
  const [showAirdropStep, setShowAirdropStep] = useState<boolean>(false)

  // Update loading state when API context loading changes
  useEffect(() => {
    if (apiLoading !== isLoading) {
      setIsLoading(apiLoading)
    }
  }, [apiLoading, isLoading])

  // Update error state when API context error changes
  useEffect(() => {
    if (apiError && !error) {
      setError(apiError)
    }
  }, [apiError, error])

  // Update current step based on authentication state
  useEffect(() => {
    if (isAuthenticated && walletAddress && currentStep === 0) {
      setCurrentStep(1)
    }

    if (isAuthenticated && token && verifyData && currentStep === 1) {
      setCurrentStep(2)
    }
  }, [isAuthenticated, walletAddress, token, verifyData, currentStep])

  // Timer effect for tracking confirmation time
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null

    if (isConfirming && !isConfirmed) {
      // The confirmationStartTime is now set in handleRequestAirdrop
      // immediately after receiving the transaction hash

      // Update the elapsed time every second
      timerInterval = setInterval(() => {
        if (confirmationStartTime) {
          const elapsed = Math.floor(
            (Date.now() - confirmationStartTime) / 1000
          )
          setElapsedTime(elapsed)
        }
      }, 1000)
    } else {
      // Reset timer when not confirming
      if (confirmationStartTime !== null) {
        setConfirmationStartTime(null)
        setElapsedTime(0)
      }
    }

    // Clean up interval on unmount or when confirming state changes
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [isConfirming, isConfirmed, confirmationStartTime])

  // Dynamically build steps based on wallet balance
  const getSteps = () => {
    // Base steps that are always shown
    const baseSteps = [
      {
        id: 0,
        title: "Connect Wallet",
        description: "Connect your non-custodial wallet",
        icon: Wallet,
        detail: "MetaMask, WalletConnect, Coinbase Wallet supported",
      },
    ]

    // If balance is 0, show Register Business, then Airdrop, and hide API Key
    if (showAirdropStep) {
      // Add Register Business as step 1
      baseSteps.push({
        id: 1,
        title: "Register Business",
        description: "Auto-fill wallet address, sign payload",
        icon: FileText,
        detail: "EIP-712 signature for secure registration",
      })

      // Add Airdrop as step 2
      baseSteps.push({
        id: 2,
        title: "Request Air Drop",
        description: "Get $UNREAL tokens to use the API",
        icon: Wallet,
        detail: "Free tokens for testing the API",
      })
    } else {
      // Normal flow: Register Business, then API Key
      baseSteps.push({
        id: 1,
        title: "Register Business",
        description: "Auto-fill wallet address, sign payload",
        icon: FileText,
        detail: "EIP-712 signature for secure registration",
      })

      // Add API Key as step 2
      baseSteps.push({
        id: 2,
        title: "Generate API Key",
        description: "One-time display with security warning",
        icon: Key,
        detail: "Copy to clipboard and store securely",
      })
    }

    return baseSteps
  }

  const steps = getSteps()

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId])
    }
    if (stepId < steps.length - 1) {
      setCurrentStep(stepId + 1)
    }
  }

  // Single-wallet flow: connect directly using active account

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await connectWallet()
      handleStepComplete(0)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to connect wallet. Please try again."
      console.error("Error connecting wallet:", error)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle business registration
  const handleRegister = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await registerWithWallet(callsAmount)

      // After successful registration, check if user has UNREAL tokens
      // This will set showAirdropStep based on balance (true if balance is 0)
      await fetchCallsAmount()

      // Complete the registration step
      handleStepComplete(1)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to register business. Please try again."
      console.error("Error registering business:", error)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle airdrop request
  const handleRequestAirdrop = async () => {
    setIsLoading(true)
    setError(null)
    setAirdropRequested(true) // Set requested state immediately to prevent multiple clicks
    try {
      // Call the typed airdrop method
      const response = await apiClient.airdrop()

      if (response && response.txHash) {
        setAirdropRequested(true)
        setAirdropTxHash(response.txHash)

        // Show appropriate message based on response
        if (response.alreadyClaimed && response.confirmed) {
          // Already claimed and confirmed, skip waiting
          setAirdropSuccess(true)
          setIsConfirmed(true)

          toast({
            title: "Airdrop Already Claimed",
            description:
              response.message || "You have already claimed your airdrop.",
          })

          // Refresh balance after airdrop
          await fetchCallsAmount()

          // Move to next step
          handleStepComplete(2)
        } else {
          // If not confirmed, wait for transaction confirmation as normal
          setIsConfirming(true)
          setConfirmationStartTime(Date.now())
          console.log("Starting confirmation process...", {
            airdropTxHash: response.txHash,
            isConfirming: true,
          })

          toast({
            title: response.alreadyClaimed
              ? "Airdrop Already Claimed (Unconfirmed)"
              : "Transaction Submitted",
            description:
              response.message ||
              "Waiting for blockchain confirmation. This may take a minute or two.",
          })

          try {
            // Wait for transaction confirmation with getPublicClient
            const chainId = await getCurrentChainId()
            const publicClient = getPublicClient(chainId)
            const receipt = await publicClient.waitForTransactionReceipt({
              hash: response.txHash as `0x${string}`,
              confirmations: 1, // Wait for 1 confirmation
              timeout: 20 * 60 * 1e3, // 20 minutes //blocktime
              pollingInterval: 10e3, // optional, check every 10s
            })

            console.log("Transaction confirmed:", receipt)
            setIsConfirming(false)
            setIsConfirmed(true)
            setAirdropSuccess(true)

            toast({
              title: "Airdrop Confirmed",
              description: "Your airdrop has been confirmed on the blockchain!",
            })

            // Refresh balance after airdrop
            await fetchCallsAmount()

            // Move to the next step (which should now be the API key step).
            handleStepComplete(2)
          } catch (confirmationError) {
            console.error(
              "Error waiting for transaction confirmation:",
              confirmationError
            )
            toast({
              title: "Confirmation Error",
              description:
                "Could not confirm transaction. You may check the status later.",
              variant: "destructive",
            })
            // Reset states on confirmation error to allow retry
            setIsConfirming(false)
            setAirdropRequested(false)
          }
        }
      } else {
        throw new Error("Invalid response from airdrop endpoint")
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to request airdrop. Please try again."
      console.error("Error requesting airdrop:", error)
      setError(errorMessage)
      // Reset all airdrop states on error
      setAirdropRequested(false)
      setAirdropSuccess(false)
      setIsConfirming(false)
      toast({
        title: "Airdrop Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle API key generation
  const handleGenerateApiKey = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Generate API key with a name based on the current date
      const keyName = `api-key-${new Date().toISOString().split("T")[0]}`
      const response = await createApiKey(keyName)

      // Show the API key dialog
      setShowApiKeyDialog(true)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate API key. Please try again."
      console.error("Error generating API key:", error)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to format time in HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Copy API key to clipboard
  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Close API key dialog
  const handleCloseApiKeyDialog = () => {
    setShowApiKeyDialog(false)
    clearApiKey() // Clear API key from context for security
    // Mark the last step as completed
    if (!completedSteps.includes(2)) {
      setCompletedSteps([...completedSteps, 2])
    }
    // Call onComplete callback if provided
    if (onComplete) {
      onComplete()
    }
  }

  const progressPercentage = (completedSteps.length / steps.length) * 100

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-6">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            From wallet connection to API key generation in under 2 minutes
          </p>
        </motion.div>

        {/* Transaction Confirmation Alert Box - Highly Visible */}
        {isConfirming && airdropTxHash && (
          <div className="max-w-3xl mx-auto px-4 mb-8">
            <Alert className="border-2 border-amber-400/50 bg-amber-50/10 shadow-lg shadow-amber-900/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="animate-pulse mr-2 h-4 w-4 rounded-full bg-amber-400"></div>
                  <AlertDescription className="font-medium text-amber-400 text-lg">
                    Confirming Airdrop Transaction
                  </AlertDescription>
                </div>
                <div className="text-amber-400 font-mono font-bold">
                  {formatTime(elapsedTime)}
                </div>
              </div>

              <p className="text-sm text-slate-300 my-3">
                Waiting for blockchain confirmation. This may take a minute or
                two.
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">Transaction ID:</div>
                <div className="text-slate-300 font-mono">
                  {`${airdropTxHash.substring(
                    0,
                    10
                  )}...${airdropTxHash.substring(airdropTxHash.length - 8)}`}
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index <= currentStep ? "text-blue-400" : "text-slate-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    completedSteps.includes(step.id)
                      ? "bg-blue-600 border-blue-600"
                      : index === currentStep
                      ? "border-blue-400 bg-slate-800"
                      : "border-slate-600 bg-slate-900"
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2 mb-8" />
        </div>

        {/* Step Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = completedSteps.includes(step.id)

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500"
                      : isCompleted
                      ? "bg-slate-800/50 border-green-500"
                      : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
                  )}

                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-600"
                            : isActive
                            ? "bg-gradient-to-r from-blue-600 to-purple-600"
                            : "bg-slate-700"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Icon className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-3 h-3 bg-blue-500 rounded-full"
                        />
                      )}
                    </div>

                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-slate-400 mb-4">{step.description}</p>
                    <p className="text-sm text-slate-500 mb-6">{step.detail}</p>

                    {/* Transaction status indicator for airdrop step */}
                    {step.id === 2 && showAirdropStep && airdropRequested && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          {isConfirming ? (
                            <span className="flex items-center text-amber-400">
                              <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-amber-400 rounded-full"></span>
                              Confirming transaction...
                            </span>
                          ) : isConfirmed ? (
                            <span className="flex items-center text-green-400">
                              <Check className="mr-2 h-4 w-4" />
                              Transaction confirmed
                            </span>
                          ) : (
                            <span className="flex items-center text-blue-400">
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Transaction submitted
                            </span>
                          )}
                        </div>
                        {airdropTxHash && (
                          <div className="text-xs text-slate-400 break-all">
                            <span className="font-semibold">Transaction:</span>{" "}
                            {airdropTxHash}
                          </div>
                        )}
                      </div>
                    )}

                    {isActive && !isCompleted && (
                      <Button
                        onClick={() => {
                          if (step.id === 0) handleConnectWallet()
                          else if (step.id === 1) handleRegister()
                          else if (step.id === 2 && showAirdropStep)
                            handleRequestAirdrop()
                          else if (
                            (step.id === 2 && !showAirdropStep) ||
                            step.id === 3
                          )
                            handleGenerateApiKey()
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={
                          isLoading ||
                          (step.id === 2 &&
                            showAirdropStep &&
                            (isConfirming || airdropRequested))
                        }
                      >
                        {isLoading ||
                        (step.id === 2 &&
                          showAirdropStep &&
                          (isConfirming || airdropRequested)) ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                            {step.id === 2 && showAirdropStep && isConfirming
                              ? "Confirming..."
                              : step.id === 2 &&
                                showAirdropStep &&
                                airdropRequested
                              ? "Processing..."
                              : "Loading..."}
                          </span>
                        ) : (
                          <>
                            {step.id === 0 &&
                              (walletAddress
                                ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                                : "Connect Wallet")}
                            {step.id === 1 && "Sign & Register"}
                            {step.id === 2 &&
                              showAirdropStep &&
                              (airdropRequested && airdropSuccess
                                ? "Airdrop Claimed"
                                : "Request Air Drop")}
                            {(step.id === 2 && !showAirdropStep) || step.id === 3
                              ? "Generate Key"
                              : ""}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </>
                        )}
                      </Button>
                    )}

                    {isCompleted && (
                      <div className="flex items-center text-green-500 text-sm">
                        <Check className="w-4 h-4 mr-2" />
                        Completed
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Demo Video */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl mx-auto mt-12 text-center"
        >
          <Card className="bg-slate-900/50 border-slate-700 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16"
                >
                  <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                </Button>
                <div className="absolute bottom-4 left-4 text-sm text-slate-300">
                  How to integrate Unreal API in 30 seconds
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Your API Key
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Alert className="mb-4 border-amber-500 bg-amber-500/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This API key will only be shown once. Please copy it and store
                it securely.
              </AlertDescription>
            </Alert>

            <div className="py-4">
              <p className="text-xl font-semibold mb-2">Your API Key</p>
              <div className="flex items-center">
                <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded block text-xs overflow-x-auto">
                  {apiKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2"
                  onClick={handleCopyApiKey}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {apiKeyHash && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">
                    API Key Hash (for verification):
                  </p>
                  <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded block text-xs overflow-x-auto">
                    {apiKeyHash}
                  </code>
                </div>
              )}
            </div>

            <p className="text-slate-400 text-sm mb-4">
              Use this key with the OpenAI API format to access Unreal AI
              services. Remember to include it in the Authorization header as:
            </p>

            <div className="bg-slate-800 p-3 rounded-md mb-4">
              <code className="text-blue-400">
                Authorization: Bearer {apiKey || "your-api-key"}
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseApiKeyDialog}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              I've Saved My API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default OnboardingFlow
