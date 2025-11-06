import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ChatCompletion from '@/components/ChatCompletion';
import { useApi } from '@/lib/ApiContext';
import Layout from '@/components/Layout';

const Chat = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, apiKey, error } = useApi();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

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
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-muted">
                <HelpCircle className="h-4 w-4" /> Guide
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end">
              <div className="space-y-2 text-sm">
                <p className="font-medium">How to use Chat</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Connect your wallet via the header</li>
                  <li>Register to obtain a session token (cookie)</li>
                  <li>Create an API key in Settings</li>
                  <li>Return here and run your first prompt</li>
                </ol>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <h1 className="text-3xl font-bold mb-6">Chat Completion</h1>
        
        {!apiKey && (
          <Alert className="mb-6 border-amber-500 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              You need to create an API key before you can use the chat completion feature.
              Please go to the Settings page to create an API key.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Chat with AI</CardTitle>
            <CardDescription>
              Test the chat completion API with your API key
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKey ? (
              <ChatCompletion />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Create an API key to start chatting
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="text-primary hover:underline"
                        onClick={() => navigate('/settings')}
                      >
                        Go to Settings
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Step 3/3: Generate your API key</TooltipContent>
                  </Tooltip>
                  <button
                    className="text-muted-foreground hover:underline"
                    onClick={() => navigate(`/playground?prompt=${encodeURIComponent('Say hello from Unreal Console!')}&autorun=1`)}
                  >
                    Try a sample in Playground
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Chat;
