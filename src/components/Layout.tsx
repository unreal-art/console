import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/ApiContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, walletAddress, logout } = useApi();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xl font-bold">
              Unreal Console
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link 
                to="/" 
                className={`${location.pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                Home
              </Link>
              <Link 
                to="/dashboard" 
                className={`${location.pathname === '/dashboard' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/chat" 
                className={`${location.pathname === '/chat' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                Chat
              </Link>
              <Link 
                to="/marketing" 
                className={`${location.pathname === '/marketing' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                Marketing
              </Link>
              <Link 
                to="/playground" 
                className={`${location.pathname === '/playground' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                Playground
              </Link>
              <Link 
                to="/settings" 
                className={`${location.pathname === '/settings' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                  {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">Connect Wallet</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Unreal Console. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
