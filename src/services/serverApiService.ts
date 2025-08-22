import { ShopifyCollection, ShopifyProduct, ShopifyProductVariant } from '@/types/shopify';

export interface ServerApiConfig {
  baseUrl: string;
}

// GraphQL response interfaces - updated to match actual API response
interface GraphQLCollection {
  id: string;
  title: string;
  handle: string;
  updatedAt: string;
}

interface GraphQLProductVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  compare_at_price: string;
  sku: string;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
  selected_options: Array<{
    name: string;
    value: string;
  }>;
}

interface GraphQLProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: GraphQLProductVariant[];
  images: Array<{
    id: string;
    src: string;
    alt: string;
    position: number;
  }>;
  options: Array<{
    id: string;
    name: string;
    position: number;
    values: string[];
  }>;
  created_at: string;
  updated_at: string;
}


export class ServerApiService {
  private config: ServerApiConfig;

  constructor(config: ServerApiConfig) {
    this.config = config;
  }

  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Server API call failed for ${endpoint}:`, error);
      throw new Error(`Server API error: ${error}`);
    }
  }

  // Adapter function to convert GraphQL collection to ShopifyCollection
  private adaptCollection(graphqlCollection: GraphQLCollection): ShopifyCollection {
    return {
      id: graphqlCollection.id,
      title: graphqlCollection.title,
      description: `Collection: ${graphqlCollection.title}`, // Default description
      handle: graphqlCollection.handle,
      products_count: 0, // We don't have this from GraphQL, set to 0
    };
  }

  // Adapter function to convert GraphQL product to ShopifyProduct
  private adaptProduct(graphqlProduct: GraphQLProduct): ShopifyProduct {
    // Convert variants directly since they're already flattened
    const variants: ShopifyProductVariant[] = graphqlProduct.variants?.map((variant) => ({
      id: variant.id,
      title: variant.title,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      sku: variant.sku,
      inventory_quantity: variant.inventory_quantity,
      weight: variant.weight,
      weight_unit: variant.weight_unit,
      selected_options: variant.selected_options,
    })) || [];

    return {
      id: graphqlProduct.id,
      title: graphqlProduct.title,
      handle: graphqlProduct.handle,
      status: graphqlProduct.status as 'active' | 'draft' | 'archived',
      vendor: graphqlProduct.vendor,
      product_type: graphqlProduct.product_type,
      tags: graphqlProduct.tags,
      variants,
      images: graphqlProduct.images?.map((image) => ({
        id: image.id,
        src: image.src,
        alt: image.alt,
        position: image.position,
      })) || [],
      options: graphqlProduct.options?.map((option) => ({
        id: option.id,
        name: option.name,
        position: option.position,
        values: option.values,
      })) || [],
      created_at: graphqlProduct.created_at,
      updated_at: graphqlProduct.updated_at,
    };
  }

  // Get products from shop
  async getProducts(limit: number = 50, after?: string): Promise<{ products: ShopifyProduct[] }> {
    let endpoint = `/api/shopify/products?limit=${limit}`;
    if (after) {
      endpoint += `&after=${after}`;
    }

    const response = await this.makeApiCall(endpoint);
    const adaptedProducts = response.products.map((product: GraphQLProduct) => this.adaptProduct(product));
    
    return { products: adaptedProducts };
  }

  // Get a specific product by ID
  async getProduct(productId: string): Promise<{ product: ShopifyProduct }> {
    const endpoint = `/api/shopify/products?id=${encodeURIComponent(productId)}`;
    const response = await this.makeApiCall(endpoint);
    const adaptedProduct = this.adaptProduct(response.product);
    
    return { product: adaptedProduct };
  }

  // Get collections from shop
  async getCollections(limit: number = 50): Promise<{ collections: ShopifyCollection[] }> {
    const endpoint = `/api/shopify/collections?limit=${limit}`;
    const response = await this.makeApiCall(endpoint);
    const adaptedCollections = response.collections.map((collection: GraphQLCollection) => this.adaptCollection(collection));
    
    return { collections: adaptedCollections };
  }

  // Get a specific collection by ID
  async getCollection(collectionId: string): Promise<{ collection: ShopifyCollection }> {
    const endpoint = `/api/shopify/collections?id=${encodeURIComponent(collectionId)}`;
    const response = await this.makeApiCall(endpoint);
    const adaptedCollection = this.adaptCollection(response.collection);
    
    return { collection: adaptedCollection };
  }

  // Get products from a specific collection
  async getProductsFromCollection(collectionId: string, limit: number = 50): Promise<{ products: ShopifyProduct[] }> {
    const endpoint = `/api/shopify/products?collection_id=${encodeURIComponent(collectionId)}&limit=${limit}`;
    const response = await this.makeApiCall(endpoint);
    const adaptedProducts = response.products.map((product: GraphQLProduct) => this.adaptProduct(product));
    
    return { products: adaptedProducts };
  }

  // Update product variant price
  async updateProductVariant(variantId: string, price: string): Promise<{ variant: ShopifyProductVariant }> {
    const endpoint = `/api/shopify/variants/${encodeURIComponent(variantId)}`;
    const body = { price };

    const response = await this.makeApiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    // Adapt the response variant
    const adaptedVariant: ShopifyProductVariant = {
      id: response.variant.id,
      title: response.variant.title,
      price: response.variant.price,
      compare_at_price: response.variant.price,
      sku: response.variant.sku,
      inventory_quantity: response.variant.inventory_quantity,
      weight: 0,
      weight_unit: 'kg',
      selected_options: response.variant.selected_options || [],
    };

    return { variant: adaptedVariant };
  }

  // CSV processing endpoints
  async uploadCsv(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = `/api/csv/upload`;
    return this.makeApiCall(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let the browser set the Content-Type for FormData
    });
  }

  async downloadCsv(): Promise<Blob> {
    const endpoint = `/api/csv/download`;
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CSV download failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }

  async getCsvStatus(): Promise<any> {
    const endpoint = `/api/csv/status`;
    return this.makeApiCall(endpoint);
  }
}
