import { createApp } from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';

export class AppBridgeService {
  private app: any;

  constructor(apiKey: string, host: string) {
    this.app = createApp({
      apiKey,
      host,
      forceRedirect: true,
    });
  }

  // Make authenticated API calls using App Bridge
  async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    // For UI demonstration, we're using mock data instead of real API calls
    // Real API calls require a backend proxy for embedded apps
    console.log('App Bridge API call requested for:', endpoint, '(using mock data instead)');
    
    // Return a promise that resolves to mock data structure
    return Promise.resolve({
      collections: [],
      products: [],
      variant: {},
    });
  }

  // Helper method to get shop from host
  private getShopFromHost(): string {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    return shop || 'your-store.myshopify.com';
  }

  // Get collections using App Bridge
  async getCollections(limit = 50): Promise<any> {
    return this.makeApiCall(`collections.json?limit=${limit}`);
  }

  // Get products from a collection
  async getProductsFromCollection(collectionId: string, limit = 50): Promise<any> {
    return this.makeApiCall(`products.json?collection_id=${collectionId}&limit=${limit}`);
  }

  // Update product variant price
  async updateProductVariant(variantId: string, price: string): Promise<any> {
    const body = {
      variant: {
        id: variantId,
        price,
      },
    };

    return this.makeApiCall(`variants/${variantId}.json`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // Redirect to Shopify Admin
  redirectToAdmin(path: string) {
    const redirect = Redirect.create(this.app);
    redirect.dispatch(Redirect.Action.ADMIN_PATH, {
      path,
    });
  }
}
