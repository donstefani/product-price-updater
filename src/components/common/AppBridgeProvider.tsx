import React, { useEffect, useState } from 'react';

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
      setConfig({ isShopify: true });
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

  // For Shopify embedded app, render without App Bridge (since we don't need it)
  if (config?.isShopify) {
    return <>{children}</>;
  }

  // Fallback: render without App Bridge
  return <>{children}</>;
}
