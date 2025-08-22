import { useState } from 'react';
import { Card, Text, Button, Modal } from '@shopify/polaris';
import { AppLayout } from '@/components/layout/AppLayout';
import { CollectionSearch } from '@/components/collections/CollectionSearch';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ShopifyCollection, ShopifyProduct } from '@/types/shopify';
import { useShopifyAuth } from '@/hooks/useShopifyAuth';

export function HomePage() {
  const { shop, serverApiService } = useShopifyAuth();
  const [selectedCollection, setSelectedCollection] = useState<ShopifyCollection | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  
  // Price change state
  const [priceChangeAmount, setPriceChangeAmount] = useState<string>('');
  const [priceChangeType, setPriceChangeType] = useState<'dollar' | 'percentage'>('dollar');
  const [priceChangeOperation, setPriceChangeOperation] = useState<'increment' | 'decrement'>('increment');
  
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

  const handleProductsSelect = (selectedProducts: ShopifyProduct[]) => {
    console.log('Selected products:', selectedProducts);
    // TODO: Handle bulk product selection for price updates
  };

  const handleProductSelect = (product: ShopifyProduct) => {
    console.log('Selected product:', product);
    // TODO: Implement product selection logic
  };

  return (
    <AppLayout title="Product Price Updater">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CollectionSearch onCollectionSelect={handleCollectionSelect} />
        
        {selectedCollection && (
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
                </div>
                {/* Price Change Picker */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f6f6f7',
                  borderRadius: '4px',
                  border: '1px solid #e1e3e5'
                }}>
                  <Text variant="headingSm" as="h3">
                    Price Change:
                  </Text>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={priceChangeOperation}
                      onChange={(e) => setPriceChangeOperation(e.target.value as 'increment' | 'decrement')}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="increment">Increment</option>
                      <option value="decrement">Decrement</option>
                    </select>
                    
                    <input
                      type="number"
                      placeholder="0.00"
                      value={priceChangeAmount}
                      onChange={(e) => setPriceChangeAmount(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        width: '80px',
                        fontSize: '14px'
                      }}
                    />
                    <select
                      value={priceChangeType}
                      onChange={(e) => setPriceChangeType(e.target.value as 'dollar' | 'percentage')}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="dollar">Dollar Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  
                  <Button size="slim" variant="primary">
                    Apply to Selected
                  </Button>
                  
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
                      <circle cx="10" cy="10" r="9" stroke="#d82c0d" strokeWidth="2" fill="none"/>
                      <path d="M10 6v4M10 14h.01" stroke="#d82c0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    onProductSelect={handleProductSelect}
                    onProductsSelect={handleProductsSelect}
                  />
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
      
      {/* Information Dialog */}
      <Modal
        open={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        title="Price Change Selectors Help"
        primaryAction={{
          content: 'Got it',
          onAction: () => setShowInfoDialog(false),
        }}
      >
        <Modal.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <Text variant="headingSm" as="h4" fontWeight="bold">
                Increment/Decrement
              </Text>
              <Text variant="bodyMd" as="p">
                Choose whether to add to or subtract from the current price. 
                <strong>Increment</strong> will increase the price, while <strong>Decrement</strong> will decrease it.
              </Text>
            </div>
            
            <div>
              <Text variant="headingSm" as="h4" fontWeight="bold">
                Amount
              </Text>
              <Text variant="bodyMd" as="p">
                Enter the numerical value for the price change. This can be a decimal number (e.g., 5.99).
              </Text>
            </div>
            
            <div>
              <Text variant="headingSm" as="h4" fontWeight="bold">
                Dollar Amount vs Percentage
              </Text>
              <Text variant="bodyMd" as="p">
                <strong>Dollar Amount:</strong> Adds or subtracts a fixed dollar value (e.g., $5.00).
                <br />
                <strong>Percentage:</strong> Adds or subtracts a percentage of the current price (e.g., 10%).
              </Text>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f6f6f7', 
              borderRadius: '4px',
              border: '1px solid #e1e3e5'
            }}>
              <Text variant="bodySm" as="p" fontWeight="bold">
                Example:
              </Text>
              <Text variant="bodySm" as="p">
                If a product costs $20.00 and you select:
                <br />
                • Increment + $5.00 = New price: $25.00
                <br />
                • Decrement - 10% = New price: $18.00
              </Text>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </AppLayout>
  );
}
