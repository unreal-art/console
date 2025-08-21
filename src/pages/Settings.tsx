import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Copy, Check, HelpCircle } from 'lucide-react';
import { useApi } from '@/lib/ApiContext';
import Layout from '@/components/Layout';

const Settings = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isLoading, 
    apiKey, 
    apiKeyHash, 
    apiKeys,
    isLoadingApiKeys,
    error, 
    createApiKey, 
    listApiKeys,
    deleteApiKey,
    clearApiKey, 
    clearError,
    connectWallet,
  } = useApi();
  
  const [apiKeyName, setApiKeyName] = useState('');
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Fetch API keys when authenticated; do not redirect away to avoid flicker/disappearing UI
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      listApiKeys().catch((err: unknown) => {
        console.error('Error fetching API keys:', err);
      });
    }
  }, [isAuthenticated, isLoading, listApiKeys]);

  // Handle API key creation
  const handleCreateApiKey = async () => {
    setIsCreating(true);
    setOperationError(null);
    try {
      const response = await createApiKey(apiKeyName);
      setApiKeyName('');
      setShowNewApiKey(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error creating API key:', errorMessage);
      setOperationError(`Failed to create API key: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle API key deletion
  const handleDeleteApiKey = async (hash: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete API key "${name}"?`)) {
      setIsDeleting(hash);
      setOperationError(null);
      try {
        const success = await deleteApiKey(hash);
        if (!success) {
          setOperationError(`Failed to delete API key "${name}"`); 
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error deleting API key ${hash}:`, errorMessage);
        setOperationError(`Failed to delete API key "${name}": ${errorMessage}`);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setShowNewApiKey(false);
    clearApiKey();
    setApiKeyName('');
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

  // Show an inline auth-required panel instead of redirecting, to prevent the page from vanishing
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <Alert className="mb-6 border-amber-500 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet connection required</AlertTitle>
            <AlertDescription>
              Please connect your wallet and register to obtain a session token before managing API keys.
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button onClick={() => connectWallet?.()}>
              Connect Wallet
            </Button>
            <Button variant="outline" onClick={() => navigate('/sign-in')}>
              Go to Sign In
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <HelpCircle className="h-4 w-4" /> Guide
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Onboarding steps</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Connect your wallet (Use the Connect Wallet button in the header)</li>
                  <li>Register — this issues a session token and sets a cookie</li>
                  <li>Create an API key here, then copy it and store safely</li>
                  <li>Head to Playground or Chat and run your first prompt</li>
                </ol>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* Show global API errors */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <button 
                className="ml-2 underline text-sm"
                onClick={clearError}
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Show operation-specific errors */}
        {operationError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Operation Error</AlertTitle>
            <AlertDescription>
              {operationError}
              <button 
                className="ml-2 underline text-sm"
                onClick={() => setOperationError(null)}
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Key Management</CardTitle>
            <CardDescription>
              Create and manage your API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* API Key Creation Form */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Create New API Key</h3>
              <div className="grid gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKeyName">API Key Name</Label>
                  <Input
                    id="apiKeyName"
                    placeholder="My API Key"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                  />
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleCreateApiKey}
                    disabled={!apiKeyName.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Creating...
                      </>
                    ) : (
                      'Create API Key'
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Step 3/3: Generate your API key</TooltipContent>
              </Tooltip>
            </div>
            
            {/* API Keys List */}
            <div>
              <h3 className="text-lg font-medium mb-4">Your API Keys</h3>
              
              {isLoadingApiKeys ? (
                <div className="flex justify-center py-4">
                  <span className="animate-spin mr-2">⏳</span>
                  Loading...
                </div>
              ) : apiKeys.length > 0 ? (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div 
                      key={key.hash} 
                      className="flex items-center justify-between p-3 border rounded bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground mr-2">
                            Hash:
                          </span>
                          <code className="text-xs bg-muted p-1 rounded">
                            {key.hash.substring(0, 12)}...{key.hash.substring(key.hash.length - 4)}
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteApiKey(key.hash, key.name)}
                        disabled={isDeleting === key.hash}
                      >
                        {isDeleting === key.hash ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  You don't have any API keys yet. Create one above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Key Created Dialog */}
        <Dialog open={showNewApiKey} onOpenChange={setShowNewApiKey}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Your new API key has been created. This is the only time you'll see this key.
                Please copy it now and store it securely.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="apiKey" className="sr-only">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  readOnly
                  value={apiKey || ''}
                  className="font-mono"
                />
              </div>
              <Button 
                size="sm" 
                className="px-3" 
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy</span>
              </Button>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseDialog}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Settings;
