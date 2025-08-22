import { useState, useEffect, useCallback } from 'react';
import { ShopifyAuthService, ShopifyAuthConfig } from '@/services/shopifyAuth';
import { AppBridgeService } from '@/services/appBridgeService';
import { ServerApiService } from '@/services/serverApiService';

interface UseShopifyAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  shop: string | null;
  accessToken: string | null;
  authService: ShopifyAuthService | null;
  appBridgeService: AppBridgeService | null;
  serverApiService: ServerApiService | null;
  installApp: (shop: string) => void;
  handleAuthCallback: (shop: string, code: string) => Promise<void>;
  logout: () => void;
}

export function useShopifyAuth(): UseShopifyAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authService, setAuthService] = useState<ShopifyAuthService | null>(null);
  const [appBridgeService, setAppBridgeService] = useState<AppBridgeService | null>(null);
  const [serverApiService, setServerApiService] = useState<ServerApiService | null>(null);

  // Initialize auth service
  useEffect(() => {
    const config: ShopifyAuthConfig = {
      apiKey: import.meta.env.VITE_SHOPIFY_API_KEY || '',
      apiSecret: import.meta.env.VITE_SHOPIFY_API_SECRET || '',
      scopes: import.meta.env.VITE_SHOPIFY_SCOPES || 'read_products,write_products',
      redirectUri: import.meta.env.VITE_SHOPIFY_REDIRECT_URI || '',
      shop: '',
    };

    if (config.apiKey && config.apiSecret) {
      setAuthService(new ShopifyAuthService(config));
    } else {
      setError('Shopify API credentials not configured');
    }
  }, []);

  // Initialize server API service
  useEffect(() => {
    const serverBaseUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3001/dev';
    setServerApiService(new ServerApiService({ baseUrl: serverBaseUrl }));
  }, []);

  // Check for existing session and embedded app context
  useEffect(() => {
    // For embedded apps, get shop from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    const hostParam = urlParams.get('host');
    const savedShop = localStorage.getItem('shopify_shop');
    const savedToken = localStorage.getItem('shopify_access_token');

    console.log('Auth check:', { shopParam, hostParam, savedShop, savedToken });

    // Use shop from URL first, then localStorage
    const currentShop = shopParam || savedShop;
    
    if (currentShop && hostParam) {
      console.log('Setting up App Bridge for embedded app');
      setShop(currentShop);
      setIsAuthenticated(true);
      setAccessToken('embedded-app-token');
      
      // Initialize App Bridge service
      const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || '';
      if (apiKey) {
        const appBridgeService = new AppBridgeService(apiKey, hostParam);
        setAppBridgeService(appBridgeService);
      }
    } else if (currentShop && savedToken) {
      console.log('Setting authenticated state with token');
      setShop(currentShop);
      setAccessToken(savedToken);
      setIsAuthenticated(true);
    } else {
      // For localhost development, set a default shop
      console.log('Setting up for localhost development');
      setShop('don-stefani-demo-store.myshopify.com');
      setIsAuthenticated(true);
      setAccessToken('localhost-dev-token');
    }
  }, []);

  const installApp = useCallback((shopDomain: string) => {
    if (!authService) {
      setError('Auth service not initialized');
      return;
    }

    try {
      const authUrl = authService.generateAuthUrl(shopDomain);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate auth URL');
    }
  }, [authService]);

  const handleAuthCallback = useCallback(async (shopDomain: string, code: string) => {
    if (!authService) {
      setError('Auth service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await authService.handleCallback(shopDomain, code);
      
      // Save to localStorage
      localStorage.setItem('shopify_shop', shopDomain);
      localStorage.setItem('shopify_access_token', token);
      
      setShop(shopDomain);
      setAccessToken(token);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  const logout = useCallback(() => {
    localStorage.removeItem('shopify_shop');
    localStorage.removeItem('shopify_access_token');
    setIsAuthenticated(false);
    setShop(null);
    setAccessToken(null);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    shop,
    accessToken,
    authService,
    appBridgeService,
    serverApiService,
    installApp,
    handleAuthCallback,
    logout,
  };
}
