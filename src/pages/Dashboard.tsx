import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/ApiContext';
import Layout from '@/components/Layout';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, verifyData, apiKey, apiKeyHash } = useApi();

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
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* API Key Card */}
          <Card>
            <CardHeader>
              <CardTitle>API Key</CardTitle>
              <CardDescription>
                Your API key status and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeyHash ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">API Key Hash:</p>
                  <p className="font-mono text-xs bg-muted p-2 rounded mb-4 break-all">
                    {apiKeyHash}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/settings')}
                  >
                    Manage API Keys
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't have an API key yet.
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => navigate('/settings')}
                  >
                    Create API Key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Your API usage and quota
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifyData ? (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Calls Remaining:</span>
                    <span className="font-medium">{verifyData.remaining || 0}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <span className="font-medium">Basic</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No usage data available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/playground')}
              >
                Open Playground
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/settings')}
              >
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
