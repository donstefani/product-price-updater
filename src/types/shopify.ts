export interface ShopifyCollection {
  id: string;
  title: string;
  description: string;
  handle: string;
  products_count: number;
  image?: {
    src: string;
    alt: string;
  };
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: 'active' | 'archived' | 'draft';
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyProductVariant[];
  images: ShopifyProductImage[];
  options: ShopifyProductOption[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: string;
  compare_at_price: string;
  sku: string;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
  selected_options: ShopifySelectedOption[];
}

export interface ShopifyProductOption {
  id: string;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyProductImage {
  id: string;
  src: string;
  alt: string;
  position: number;
}

export interface ShopifyAPIResponse<T> {
  data: T;
  errors?: string[];
}
