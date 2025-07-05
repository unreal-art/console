import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useApi } from '@/lib/ApiContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useApi();
  
  // Redirect to dashboard if already authenticated
  // Otherwise redirect to sign-in page for the enhanced wallet experience
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/sign-in');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Display a simple loading screen while redirecting
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl">Redirecting...</CardTitle>
              <CardDescription>
                Taking you to the enhanced wallet connection page
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
