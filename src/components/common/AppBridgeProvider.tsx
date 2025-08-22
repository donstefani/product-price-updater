import React, { useEffect, useState } from 'react';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export function AppBridgeProviderWrapper({ children }: AppBridgeProviderProps) {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get shop from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const host = urlParams.get('host');

    if (shop && host) {
      // Shopify embedded app scenario
      const appBridgeConfig = {
        apiKey: import.meta.env.VITE_SHOPIFY_API_KEY || '',
        host: host,
        forceRedirect: true,
      };
      setConfig(appBridgeConfig);
    } else {
      // Localhost development scenario - no App Bridge needed
      setConfig({ isLocalhost: true });
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Loading app...</div>
      </div>
    );
  }

  // For localhost development, render without App Bridge
  if (config?.isLocalhost) {
    return <>{children}</>;
  }

  // For Shopify embedded app, use App Bridge
  return (
    <AppBridgeProvider config={config}>
      {children}
    </AppBridgeProvider>
  );
}
