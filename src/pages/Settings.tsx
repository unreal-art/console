import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { useApi } from '@/lib/ApiContext';
import Layout from '@/components/Layout';

const Settings = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isLoading, 
    apiKey, 
    apiKeyHash, 
    error, 
    createApiKey, 
    clearApiKey, 
    clearError 
  } = useApi();
  
  const [apiKeyName, setApiKeyName] = useState('');
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Handle API key creation
  const handleCreateApiKey = async () => {
    if (!apiKeyName.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await createApiKey(apiKeyName);
      setShowNewApiKey(true);
    } catch (err) {
      console.error('Error creating API key:', err);
    } finally {
      setIsCreating(false);
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
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
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Key Management</CardTitle>
            <CardDescription>
              Create and manage your API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeyHash ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current API Key Hash:</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mb-4 break-all">
                  {apiKeyHash}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setApiKeyName('')}
                  >
                    Create New Key
                  </Button>
                </div>
              </div>
            ) : (
              <div>
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
              </div>
            )}
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
