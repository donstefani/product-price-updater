import { useState } from 'react';
import { Card, Text, Modal } from '@shopify/polaris';
import { AppLayout } from '@/components/layout/AppLayout';
import { CollectionSearch } from '@/components/collections/CollectionSearch';
import { ProductGrid } from '@/components/products/ProductGrid';
import { PriceChangePanel } from '@/components/price-change/PriceChangePanel';
import { ShopifyCollection, ShopifyProduct } from '@/types/shopify';
import { useShopifyAuth } from '@/hooks/useShopifyAuth';

export function HomePage() {
  const { shop, serverApiService } = useShopifyAuth();
  const [selectedCollection, setSelectedCollection] = useState<ShopifyCollection | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  
  // Information dialog state
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const handleCollectionSelect = async (collection: ShopifyCollection) => {
    if (!shop || !serverApiService) {
      setProductError('Shop or API service not available');
      return;
    }

    setSelectedCollection(collection);
    setIsLoadingProducts(true);
    setProductError(null);
    setSelectedProducts([]); // Clear selections when changing collection
    
    try {
      console.log('Fetching products from collection:', collection.id);
      
      // Use the server API service to get products from the collection
      const response = await serverApiService.getProductsFromCollection(collection.id, 50);
      setProducts(response.products);
      
      console.log('Products loaded:', response.products.length);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProductError(err instanceof Error ? err.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductsSelect = (products: ShopifyProduct[]) => {
    console.log('Selected products:', products);
    setSelectedProducts(products);
  };

  const handleProductSelect = (product: ShopifyProduct) => {
    console.log('Selected product:', product);
    // Toggle selection for single product
    const isSelected = selectedProducts.some(p => p.id === product.id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handlePriceChangeComplete = () => {
    // Refresh products after price change
    if (selectedCollection) {
      handleCollectionSelect(selectedCollection);
    }
  };

  return (
    <AppLayout title="Product Price Updater">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CollectionSearch onCollectionSelect={handleCollectionSelect} />
        
        {selectedCollection && (
          <>
            {/* Price Change Panel */}
            <PriceChangePanel
              products={products}
              selectedProducts={selectedProducts}
              onProductSelect={handleProductSelect}
              onProductsSelect={handleProductsSelect}
              onPriceChangeComplete={handlePriceChangeComplete}
              serverApiService={serverApiService}
              collectionName={selectedCollection.title}
            />
            
            {/* Products Display */}
            <Card>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <Text variant="headingMd" as="h2">
                      Products in "{selectedCollection.title}"
                    </Text>
                    
                    <button
                      onClick={() => setShowInfoDialog(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Price change help"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="10" cy="10" r="9" stroke="rgb(0, 128, 96)" strokeWidth="2" fill="none"/>
                        <path d="M10 6v4M10 14h.01" stroke="rgb(0, 128, 96)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  {productError && (
                    <div style={{ 
                      padding: '0.75rem', 
                      backgroundColor: '#fef7f7', 
                      border: '1px solid #d82c0d', 
                      borderRadius: '4px',
                      color: '#d82c0d'
                    }}>
                      <Text variant="bodySm" as="p">{productError}</Text>
                    </div>
                  )}
                  
                  {isLoadingProducts ? (
                    <div style={{ 
                      padding: '2rem', 
                      textAlign: 'center',
                      color: '#637381'
                    }}>
                      <Text variant="bodyMd" as="p">Loading products...</Text>
                    </div>
                  ) : (
                    <ProductGrid 
                      products={products}
                      selectedProducts={selectedProducts}
                      onProductSelect={handleProductSelect}
                      onProductsSelect={handleProductsSelect}
                    />
                  )}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
      
      {/* Information Dialog */}
      <Modal
        open={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        title="Price Change Help"
        primaryAction={{
          content: 'Got it',
          onAction: () => setShowInfoDialog(false),
        }}
      >
        <Modal.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <Text variant="headingSm" as="h4" fontWeight="bold">
                How to Use Price Change Operations
              </Text>
              <Text variant="bodyMd" as="p">
                1. <strong>Select a Collection:</strong> Choose the collection containing products you want to update.
              </Text>
              <Text variant="bodyMd" as="p">
                2. <strong>Select Products:</strong> Use the "Select All" button or individually select products from the list.
              </Text>
              <Text variant="bodyMd" as="p">
                3. <strong>Configure Price Changes:</strong> Choose increment/decrement, amount, and type (dollar or percentage).
              </Text>
              <Text variant="bodyMd" as="p">
                4. <strong>Review Preview:</strong> Check the price change preview to ensure accuracy.
              </Text>
              <Text variant="bodyMd" as="p">
                5. <strong>Process Changes:</strong> Click "Process Changes" to apply the updates.
              </Text>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f6f6f7', 
              borderRadius: '4px',
              border: '1px solid #e1e3e5'
            }}>
              <Text variant="bodySm" as="p" fontWeight="bold">
                Safety Features:
              </Text>
              <Text variant="bodySm" as="p">
                • Before/after snapshots are automatically created for each operation
                • Rollback functionality allows you to revert to previous prices
                • Repeat functionality lets you reapply successful operations
                • Operation history tracks all changes with timestamps and user information
              </Text>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </AppLayout>
  );
}
