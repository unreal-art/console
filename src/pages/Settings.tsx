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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/ApiContext';
import Layout from '@/components/Layout';

const MAX_KEYS = 20;

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
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

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

  // Handle API key deletion (confirmation handled via AlertDialog in UI)
  const handleDeleteApiKey = async (hash: string, name: string) => {
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
  };

  // Copy a key hash from the list
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Key Management</CardTitle>
                <CardDescription>Create and manage your API keys</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {apiKeys.length}/{MAX_KEYS} used
              </Badge>
            </div>
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
                    disabled={apiKeys.length >= MAX_KEYS}
                  />
                </div>
              </div>
              {apiKeys.length >= MAX_KEYS ? (
                <Alert className="mb-4 border-amber-500 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>API key limit reached</AlertTitle>
                  <AlertDescription>
                    You can create up to {MAX_KEYS} API keys. Delete an existing key to create a new one.
                  </AlertDescription>
                </Alert>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">
                  You can create up to {MAX_KEYS} keys. Remaining: {MAX_KEYS - apiKeys.length}.
                </p>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleCreateApiKey}
                    disabled={!apiKeyName.trim() || isCreating || apiKeys.length >= MAX_KEYS}
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
                  {apiKeys.map((key) => {
                    const displayHash = key.hash ?? ""
                    const shortHash = displayHash
                      ? `${displayHash.substring(0, 12)}...${displayHash.substring(Math.max(0, displayHash.length - 4))}`
                      : "N/A"
                    const reactKey = `${key.hash ?? ''}:${key.name}:${key.created_at ?? ''}`
                    const created = key.created_at ? new Date(key.created_at).toLocaleDateString() : "—"
                    const isDeletingThis = isDeleting === displayHash
                    return (
                      <div 
                        key={reactKey}
                        className="flex items-center justify-between p-3 border rounded bg-muted/30"
                      >
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Hash:</span>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {shortHash}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleCopyHash(displayHash)}
                              disabled={!displayHash}
                            >
                              {copiedHash === displayHash ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" /> Copy hash
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {created}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={isDeletingThis || !displayHash}
                            >
                              {isDeletingThis ? (
                                <>
                                  <span className="animate-spin mr-2">⏳</span>
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete API key</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the API key "{key.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteApiKey(displayHash, key.name)} disabled={!displayHash}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )
                  })}
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
