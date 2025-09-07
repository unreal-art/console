import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/lib/ApiContext';
import { getConfiguredChains, switchChain } from '@/lib/onboard';
import { walletService } from '@/lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress, logout, connectWallet } = useApi();
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [chains, setChains] = useState(getConfiguredChains());

  useEffect(() => {
    // Sync current chain when wallet connects
    const sync = async () => {
      try {
        if (walletAddress) {
          const id = await walletService.getChainId();
          const hex = `0x${id.toString(16)}`.toLowerCase();
          setChainId(hex);
          // Attempt to restore last selected chain if different
          try {
            const stored = localStorage.getItem('unreal_last_chain');
            if (stored && stored.toLowerCase() !== hex) {
              // Restrict switching to Sign-In page only
              if (location.pathname === '/sign-in') {
                await switchChain(stored);
                setChainId(stored.toLowerCase());
              }
            }
          } catch (_) {
            // ignore restore errors
          }
        } else {
          setChainId(null);
        }
        // refresh chains in case backend-configured chains were initialized
        setChains(getConfiguredChains());
      } catch (e) {
        // ignore
      }
    };
    void sync();
  }, [walletAddress, location.pathname]);

  // Global navigation shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (target?.isContentEditable ?? false);
      if (isTyping) return;
      const key = e.key?.toLowerCase?.() ?? '';
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        switch (key) {
          case 'h':
            navigate('/');
            return;
          case 'p':
            navigate('/playground');
            return;
          case 'a':
            navigate('/airdrop');
            return;
          case 's':
            navigate('/settings');
            return;
          case 'd':
            navigate('/dashboard');
            return;
          case 'g':
            navigate('/?guided=1');
            return;
          default:
            return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const handleChainChange = async (value: string) => {
    try {
      await switchChain(value);
      setChainId(value.toLowerCase());
    } catch (e) {
      console.warn('Failed to switch chain', e);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      // Do not switch chains automatically here; user will be taken to Sign-In
      // where chain selection/switching is permitted.
    } finally {
      setIsConnecting(false);
      // Always take the user to sign-in to complete session/token setup
      navigate('/sign-in');
    }
  };

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
                to="/playground" 
                className={`${location.pathname === '/playground' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
              >
                Playground
              </Link>
              <Link 
                to="/airdrop" 
                className={`${location.pathname === '/airdrop' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
                title="Airdrop • Cmd/Ctrl+Shift+A"
              >
                Airdrop
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/?guided=1">
                  <Button variant="outline" size="sm" title="Guided Start (Cmd/Ctrl+Shift+G)">Guided Start</Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Replay onboarding modal • Cmd/Ctrl+Shift+G</TooltipContent>
            </Tooltip>
            {location.pathname === '/sign-in' && chains.length > 0 && (
              <Select
                value={(chainId ?? chains[0]?.id) as string}
                onValueChange={handleChainChange}
                disabled={!walletAddress}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
              <Button size="sm" onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
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
