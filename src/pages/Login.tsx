import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Wallet, LogIn } from 'lucide-react';
import OnboardingFlow from '@/components/OnboardingFlow';
import { useApi } from '@/lib/ApiContext';
import Layout from '@/components/Layout';

const Login = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isLoading, 
    walletAddress, 
    error, 
    connectWallet,
    registerWithWallet,
    clearError 
  } = useApi();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      // Don't show onboarding yet, wait for Sign In
    } catch (err) {
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet registration/sign in
  const handleSignIn = async () => {
    if (!walletAddress) return;
    
    setIsRegistering(true);
    try {
      // For now, using a default value of 10 calls
      // In production, this would query the actual $UNREAL token balance
      const calls = 10;
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

  if (isLoading) {
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
            <CardTitle className="text-2xl">Unreal Console</CardTitle>
            <CardDescription>
              {!walletAddress 
                ? 'Connect your wallet to get started'
                : !isAuthenticated 
                ? 'Sign in with your wallet' 
                : 'Wallet connected'}
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
              {!walletAddress ? (
                <Button 
                  onClick={handleConnectWallet} 
                  disabled={isLoading || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    'Connecting...'
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                    </>
                  )}
                </Button>
              ) : !isAuthenticated ? (
                <Button 
                  onClick={handleSignIn} 
                  disabled={isLoading || isRegistering}
                  className="w-full"
                  variant="default"
                >
                  {isRegistering ? (
                    'Signing In...'
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </>
                  )}
                </Button>
              ) : null}
              
              {walletAddress && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Wallet connected:</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{walletAddress}</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              You need a compatible wallet to use Unreal Console
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
    </Layout>
  );
};

export default Login;
