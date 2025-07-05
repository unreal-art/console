import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Wallet, LogIn, ArrowRight, RefreshCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { publicClient } from '../config/viem';
import OnboardingFlow from '@/components/OnboardingFlow';
import { useApi } from '@/lib/ApiContext';
import Layout from '@/components/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

// ABI for the $UNREAL token (minimal version for balanceOf)
const UNREAL_TOKEN_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
];

// Unreal token address
const UNREAL_TOKEN_ADDRESS = '0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB';

const SignIn = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isLoading: apiLoading, 
    walletAddress, 
    error, 
    connectWallet,
    registerWithWallet,
    clearError 
  } = useApi();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [unrealBalance, setUnrealBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!apiLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, apiLoading, navigate]);

  // Get available wallet addresses - wrapped in useCallback to prevent dependency changes on every render
  const getConnectedWallets = useCallback(async () => {
    try {
      // Check if window.ethereum exists
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setWalletAddresses(accounts);
          // If we have a wallet address but no selected address, set the first one
          if (!selectedAddress && accounts.length > 0) {
            setSelectedAddress(accounts[0]);
            // Fetch unreal balance for the first account
            fetchUnrealBalance(accounts[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error getting connected wallets:', err);
    }
  }, [selectedAddress, fetchUnrealBalance]);

  // Check for connected wallets on load
  useEffect(() => {
    getConnectedWallets();
    
    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddresses(accounts);
        setSelectedAddress(accounts[0]);
        fetchUnrealBalance(accounts[0]);
      } else {
        setWalletAddresses([]);
        setSelectedAddress(null);
        setUnrealBalance(0);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [getConnectedWallets]);

  // Fetch UNREAL token balance
  const fetchUnrealBalance = async (address: string) => {
    if (!address) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await publicClient.readContract({
        address: UNREAL_TOKEN_ADDRESS as `0x${string}`,
        abi: UNREAL_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      
      // Convert to number for simplicity
      // In production, you might want to handle BigInt properly
      const balanceNumber = Number(balance) / 10**18; // Assuming 18 decimals
      setUnrealBalance(balanceNumber);
    } catch (err) {
      console.error('Error fetching UNREAL balance:', err);
      setUnrealBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      // After connecting, get all available accounts
      getConnectedWallets();
      setShowWalletModal(true);
    } catch (err) {
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet selection
  const handleSelectWallet = (address: string) => {
    setSelectedAddress(address);
    fetchUnrealBalance(address);
  };

  // Handle wallet registration/sign in
  const handleSignIn = async () => {
    if (!selectedAddress) return;
    
    setIsRegistering(true);
    try {
      // Use the UNREAL balance as the number of calls
      // If balance is 0, use a default value
      const calls = unrealBalance > 0 ? Math.floor(unrealBalance) : 10;
      
      await registerWithWallet(calls);
      setShowOnboarding(true);
    } catch (err) {
      console.error('Error registering wallet:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };

  if (apiLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container flex items-center justify-center min-h-[calc(100vh-14rem)] py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In to Unreal Console</CardTitle>
            <CardDescription>
              {!walletAddresses.length 
                ? 'Connect your wallet to get started'
                : !isAuthenticated 
                ? `Sign in with your wallet (${unrealBalance} UNREAL available)`
                : 'Wallet connected and authenticated'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal text-sm underline ml-2"
                    onClick={clearError}
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-4">
              {!walletAddresses.length ? (
                <Button 
                  onClick={handleConnectWallet} 
                  disabled={apiLoading || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                    </>
                  )}
                </Button>
              ) : !isAuthenticated ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Selected Wallet:</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowWalletModal(true)}
                    >
                      Change Wallet
                    </Button>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md mb-4">
                    <p className="text-xs font-mono break-all">{selectedAddress}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm">UNREAL Balance:</p>
                    {isLoadingBalance ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <p className="font-medium">{unrealBalance} UNREAL</p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSignIn} 
                    disabled={apiLoading || isRegistering || !selectedAddress}
                    className="w-full"
                    variant="default"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" /> Sign In
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => fetchUnrealBalance(selectedAddress || '')}
                  >
                    <RefreshCcw className="mr-2 h-3 w-3" /> Refresh Balance
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              Need help? <a href="#" className="text-primary hover:underline">View Documentation</a>
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Wallet Selection Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Wallet</DialogTitle>
            <DialogDescription>
              Choose which connected wallet to use for sign-in
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto py-2">
            {walletAddresses.map((address) => (
              <Button
                key={address}
                variant={selectedAddress === address ? "default" : "outline"}
                className="w-full justify-between"
                onClick={() => {
                  handleSelectWallet(address);
                  setShowWalletModal(false);
                }}
              >
                <span className="text-xs font-mono truncate max-w-[220px]">
                  {address}
                </span>
                {selectedAddress === address && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            ))}
            
            {walletAddresses.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No wallets connected. Please connect your wallet first.
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowWalletModal(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
    </Layout>
  );
};

export default SignIn;
