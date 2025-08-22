// Shopify Authentication Service
export interface ShopifyAuthConfig {
  apiKey: string;
  apiSecret: string;
  scopes: string;
  redirectUri: string;
  shop: string;
}

export class ShopifyAuthService {
  private config: ShopifyAuthConfig;

  constructor(config: ShopifyAuthConfig) {
    this.config = config;
  }

  // Generate OAuth URL for app installation
  generateAuthUrl(shop: string, state?: string): string {
    const nonce = state || Math.random().toString(36).substring(2);
    const scopes = this.config.scopes;
    const redirectUri = this.config.redirectUri;
    const clientId = this.config.apiKey;

    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: nonce,
      'grant_options[]': 'per-user',
    });

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  // Handle OAuth callback and get access token
  async handleCallback(shop: string, code: string): Promise<string> {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.apiKey,
        client_secret: this.config.apiSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  // Make authenticated API calls
  async makeApiCall(shop: string, accessToken: string, endpoint: string, options: RequestInit = {}): Promise<any> {
    // For embedded apps, we need to use App Bridge or proxy through our backend
    // For now, let's use a simple approach with the access token
    const url = `https://${shop}/admin/api/2025-01/${endpoint}`;
    
    // Check if this is an embedded app (dummy token)
    if (accessToken === 'embedded-app-token') {
      // For embedded apps, we need to handle this differently
      // For now, let's try a direct call (this might not work due to CORS)
      console.log('Making API call for embedded app:', url);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get products from shop
  async getProducts(shop: string, accessToken: string, limit = 50, after?: string): Promise<any> {
    let endpoint = `products.json?limit=${limit}`;
    if (after) {
      endpoint += `&page_info=${after}`;
    }

    return this.makeApiCall(shop, accessToken, endpoint);
  }

  // Get collections from shop
  async getCollections(shop: string, accessToken: string, limit = 50): Promise<any> {
    const endpoint = `collections.json?limit=${limit}`;
    return this.makeApiCall(shop, accessToken, endpoint);
  }

  // Update product variant price
  async updateProductVariant(shop: string, accessToken: string, variantId: string, price: string): Promise<any> {
    const endpoint = `variants/${variantId}.json`;
    const body = {
      variant: {
        id: variantId,
        price,
      },
    };

    return this.makeApiCall(shop, accessToken, endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
}
