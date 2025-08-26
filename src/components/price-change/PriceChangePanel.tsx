import { useState } from 'react';
import { Card, Text, Button, Modal, Banner, Spinner, Select, TextField } from '@shopify/polaris';
import { ShopifyProduct } from '@/types/shopify';

interface PriceChangePanelProps {
  products: ShopifyProduct[];
  selectedProducts: ShopifyProduct[];
  onProductSelect: (product: ShopifyProduct) => void;
  onProductsSelect: (products: ShopifyProduct[]) => void;
  onPriceChangeComplete: () => void;
  serverApiService: any;
  collectionName: string;
}

interface PriceChangeConfig {
  operation: 'increment' | 'decrement';
  amount: string;
  type: 'dollar' | 'percentage';
}

export function PriceChangePanel({
  products,
  selectedProducts,
  onProductsSelect,
  onPriceChangeComplete,
  serverApiService,
  collectionName
}: PriceChangePanelProps) {
  const [priceConfig, setPriceConfig] = useState<PriceChangeConfig>({
    operation: 'increment',
    amount: '',
    type: 'dollar'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRollbackMode, setIsRollbackMode] = useState(false);
  const [rollbackOperationId, setRollbackOperationId] = useState<string | null>(null);
  const [isRepeatMode, setIsRepeatMode] = useState(false);
  const [repeatOperationId, setRepeatOperationId] = useState<string | null>(null);

  const handleSelectAll = () => {
    onProductsSelect(products);
  };

  const handleDeselectAll = () => {
    onProductsSelect([]);
  };

  const calculateNewPrice = (currentPrice: string, config: PriceChangeConfig): string => {
    const current = parseFloat(currentPrice);
    const amount = parseFloat(config.amount);
    
    if (isNaN(current) || isNaN(amount)) return currentPrice;
    
    let newPrice: number;
    
    if (config.type === 'dollar') {
      newPrice = config.operation === 'increment' ? current + amount : current - amount;
    } else {
      // percentage
      const percentage = amount / 100;
      newPrice = config.operation === 'increment' ? current * (1 + percentage) : current * (1 - percentage);
    }
    
    return Math.max(0, newPrice).toFixed(2);
  };

  const prepareCsvData = (): any[] => {
    const csvData: any[] = [];
    
    selectedProducts.forEach(product => {
      // Process all variants for each product
      product.variants.forEach(variant => {
        const newPrice = calculateNewPrice(variant.price, priceConfig);
        
        csvData.push({
          Handle: product.handle,
          Title: product.title,
          'Variant Price': newPrice,
          'Variant ID': variant.id,
          'Product ID': product.id,
          'Variant Title': variant.title
        });
      });
    });
    
    return csvData;
  };

  const handleProcessPriceChanges = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    if (!priceConfig.amount || parseFloat(priceConfig.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const csvData = prepareCsvData();
      
      // Mock user data - in a real app, this would come from authentication
      const userId = 'user-123';
      const userName = 'Test User';
      
      const response = await serverApiService.processPriceChanges(
        csvData,
        userId,
        userName,
        collectionName
      );

      setSuccess(`Successfully processed ${selectedProducts.length} products. Operation ID: ${response.operationId}`);
      setShowConfirmModal(false);
      onPriceChangeComplete();
      
      // Clear selections
      onProductsSelect([]);
      setPriceConfig({ operation: 'increment', amount: '', type: 'dollar' });
      
    } catch (err) {
      console.error('Price change processing failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to process price changes');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPriceHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await serverApiService.getPriceChangeHistory();
      setPriceHistory(response.operations || []);
    } catch (err) {
      console.error('Failed to load price history:', err);
      setError('Failed to load price history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRollback = async (operationId: string) => {
    try {
      const response = await serverApiService.getRollbackData(operationId);
      console.log('Rollback data:', response);
      
      // Parse the CSV data and populate the product selection
      if (response.rollbackData) {
        const csvLines = response.rollbackData.split('\n');
        const headers = csvLines[0].split(',').map((h: string) => h.replace(/"/g, ''));
        const rollbackProducts: ShopifyProduct[] = [];
        
        for (let i = 1; i < csvLines.length; i++) {
          if (csvLines[i].trim()) {
            const values = csvLines[i].split(',').map((v: string) => v.replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header: string, index: number) => {
              row[header] = values[index];
            });
            
            // Find the corresponding product in the current products list
            const matchingProduct = products.find(p => p.handle === row.Handle);
            if (matchingProduct) {
              rollbackProducts.push(matchingProduct);
            }
          }
        }
        
        if (rollbackProducts.length > 0) {
          onProductsSelect(rollbackProducts);
          setIsRollbackMode(true);
          setRollbackOperationId(operationId);
          setSuccess(`Loaded ${rollbackProducts.length} products for rollback from operation ${operationId}. Click "Run Rollback" to apply the rollback.`);
          setShowHistoryModal(false);
        } else {
          setError('No matching products found for rollback');
        }
      } else {
        setError('No rollback data available');
      }
    } catch (err) {
      setError('Failed to load rollback data');
    }
  };

  const handleRepeat = async (operationId: string) => {
    try {
      const response = await serverApiService.getRepeatData(operationId);
      console.log('Repeat data:', response);
      
      // Parse the CSV data and populate the product selection
      if (response.repeatData) {
        const csvLines = response.repeatData.split('\n');
        const headers = csvLines[0].split(',').map((h: string) => h.replace(/"/g, ''));
        const repeatProducts: ShopifyProduct[] = [];
        
        for (let i = 1; i < csvLines.length; i++) {
          if (csvLines[i].trim()) {
            const values = csvLines[i].split(',').map((v: string) => v.replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header: string, index: number) => {
              row[header] = values[index];
            });
            
            // Find the corresponding product in the current products list
            const matchingProduct = products.find(p => p.handle === row.Handle);
            if (matchingProduct) {
              repeatProducts.push(matchingProduct);
            }
          }
        }
        
        if (repeatProducts.length > 0) {
          onProductsSelect(repeatProducts);
          setIsRepeatMode(true);
          setRepeatOperationId(operationId);
          setSuccess(`Loaded ${repeatProducts.length} products for repeat from operation ${operationId}. Click "Run Repeat" to apply the repeat.`);
          setShowHistoryModal(false);
        } else {
          setError('No matching products found for repeat');
        }
      } else {
        setError('No repeat data available');
      }
    } catch (err) {
      setError('Failed to load repeat data');
    }
  };

  const handleExecuteRollback = async () => {
    if (!rollbackOperationId) {
      setError('No rollback operation selected');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the rollback data (the "before" snapshot)
      const response = await serverApiService.getRollbackData(rollbackOperationId);
      
      if (!response.rollbackData) {
        throw new Error('No rollback data available');
      }

      // Parse the CSV data to get the original prices
      const csvLines = response.rollbackData.split('\n');
      const headers = csvLines[0].split(',').map((h: string) => h.replace(/"/g, ''));
      
      // Create CSV data for the rollback operation
      const rollbackCsvData: any[] = [];
      
      for (let i = 1; i < csvLines.length; i++) {
        if (csvLines[i].trim()) {
          const values = csvLines[i].split(',').map((v: string) => v.replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header: string, index: number) => {
            row[header] = values[index];
          });
          
          // Only include products that are currently selected
          const isSelected = selectedProducts.some(p => p.handle === row.Handle);
          if (isSelected) {
            rollbackCsvData.push({
              Handle: row.Handle,
              Title: row.Title,
              'Variant Price': row['Variant Price'],
              'Variant ID': row['Variant ID'],
              'Product ID': row['Product ID']
            });
          }
        }
      }

      if (rollbackCsvData.length === 0) {
        throw new Error('No selected products found in rollback data');
      }

      // Process the rollback using the same API as regular price changes
      await serverApiService.processPriceChanges(
        rollbackCsvData,
        'rollback-user', // You might want to get the actual user ID
        'Rollback User',
        `Rollback from operation ${rollbackOperationId}`
      );

      setSuccess(`Successfully rolled back ${rollbackCsvData.length} products to their previous prices`);
      setIsRollbackMode(false);
      setRollbackOperationId(null);
      onPriceChangeComplete();
      
    } catch (err: any) {
      setError(`Rollback failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteRepeat = async () => {
    if (!repeatOperationId) {
      setError('No repeat operation selected');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the repeat data (the "after" snapshot)
      const response = await serverApiService.getRepeatData(repeatOperationId);
      
      if (!response.repeatData) {
        throw new Error('No repeat data available');
      }

      // Parse the CSV data to get the target prices
      const csvLines = response.repeatData.split('\n');
      const headers = csvLines[0].split(',').map((h: string) => h.replace(/"/g, ''));
      
      // Create CSV data for the repeat operation
      const repeatCsvData: any[] = [];
      
      for (let i = 1; i < csvLines.length; i++) {
        if (csvLines[i].trim()) {
          const values = csvLines[i].split(',').map((v: string) => v.replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header: string, index: number) => {
            row[header] = values[index];
          });
          
          // Only include products that are currently selected
          const isSelected = selectedProducts.some(p => p.handle === row.Handle);
          if (isSelected) {
            repeatCsvData.push({
              Handle: row.Handle,
              Title: row.Title,
              'Variant Price': row['Variant Price'],
              'Variant ID': row['Variant ID'],
              'Product ID': row['Product ID']
            });
          }
        }
      }

      if (repeatCsvData.length === 0) {
        throw new Error('No selected products found in repeat data');
      }

      // Process the repeat using the same API as regular price changes
      await serverApiService.processPriceChanges(
        repeatCsvData,
        'repeat-user', // You might want to get the actual user ID
        'Repeat User',
        `Repeat from operation ${repeatOperationId}`
      );

      setSuccess(`Successfully repeated ${repeatCsvData.length} products with their target prices`);
      setIsRepeatMode(false);
      setRepeatOperationId(null);
      onPriceChangeComplete();
      
    } catch (err: any) {
      setError(`Repeat failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headingMd" as="h2">
              Price Change Operations
            </Text>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="slim" onClick={() => setShowHistoryModal(true)}>
                View History
              </Button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}
          
          {success && (
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          )}

          {/* Product Selection */}
          <div>
            <Text variant="headingSm" as="h3">
              Selected Products ({selectedProducts.length} of {products.length})
            </Text>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button size="slim" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button size="slim" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Price Change Configuration */}
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#f6f6f7',
            borderRadius: '4px',
            border: '1px solid #e1e3e5'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <Text variant="headingSm" as="h3">
                Price Change Configuration
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '120px' }}>
                <Select
                  label="Operation"
                  options={[
                    { label: 'Increment', value: 'increment' },
                    { label: 'Decrement', value: 'decrement' }
                  ]}
                  value={priceConfig.operation}
                  onChange={(value) => setPriceConfig(prev => ({ ...prev, operation: value as 'increment' | 'decrement' }))}
                />
              </div>
              
              <div style={{ minWidth: '120px' }}>
                <TextField
                  label="Amount"
                  type="number"
                  value={priceConfig.amount}
                  onChange={(value) => setPriceConfig(prev => ({ ...prev, amount: value }))}
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
              
              <div style={{ minWidth: '140px' }}>
                <Select
                  label="Type"
                  options={[
                    { label: 'Dollar Amount', value: 'dollar' },
                    { label: 'Percentage', value: 'percentage' }
                  ]}
                  value={priceConfig.type}
                  onChange={(value) => setPriceConfig(prev => ({ ...prev, type: value as 'dollar' | 'percentage' }))}
                />
              </div>
              
              <div style={{ alignSelf: 'end' }}>
                <Button
                  variant="primary"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={selectedProducts.length === 0 || !priceConfig.amount || isProcessing}
                  loading={isProcessing}
                >
                  Process Changes
                </Button>
              </div>
              
              {/* Run Rollback Button - only show when in rollback mode */}
              {isRollbackMode && (
                <div style={{ alignSelf: 'end', display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="primary"
                    tone="critical"
                    onClick={handleExecuteRollback}
                    disabled={selectedProducts.length === 0 || isProcessing}
                    loading={isProcessing}
                  >
                    Run Rollback
                  </Button>
                  <Button
                    onClick={() => {
                      setIsRollbackMode(false);
                      setRollbackOperationId(null);
                      setSuccess(null);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel Rollback
                  </Button>
                </div>
              )}
              
              {/* Run Repeat Button - only show when in repeat mode */}
              {isRepeatMode && (
                <div style={{ alignSelf: 'end', display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="primary"
                    tone="success"
                    onClick={handleExecuteRepeat}
                    disabled={selectedProducts.length === 0 || isProcessing}
                    loading={isProcessing}
                  >
                    Run Repeat
                  </Button>
                  <Button
                    onClick={() => {
                      setIsRepeatMode(false);
                      setRepeatOperationId(null);
                      setSuccess(null);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel Repeat
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {selectedProducts.length > 0 && priceConfig.amount && (
            <div>
              <Text variant="headingSm" as="h3">
                Price Change Preview
              </Text>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '0.5rem' }}>
                {selectedProducts.slice(0, 3).map((product) => (
                  <div key={product.id} style={{ 
                    padding: '0.5rem', 
                    border: '1px solid #e1e3e5', 
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    backgroundColor: 'white'
                  }}>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      {product.title}
                    </Text>
                    {product.variants.map((variant) => {
                      const newPrice = calculateNewPrice(variant.price, priceConfig);
                      const change = parseFloat(newPrice) - parseFloat(variant.price);
                      
                      return (
                        <div key={variant.id} style={{ 
                          marginLeft: '1rem', 
                          marginTop: '0.25rem',
                          padding: '0.25rem',
                          backgroundColor: '#f6f6f7',
                          borderRadius: '2px'
                        }}>
                          <Text variant="bodySm" as="p">
                            {variant.title}: ${variant.price} → ${newPrice}
                            <span style={{ 
                              color: change >= 0 ? '#50b83c' : '#d82c0d',
                              marginLeft: '0.5rem'
                            }}>
                              ({change >= 0 ? '+' : ''}${change.toFixed(2)})
                            </span>
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {selectedProducts.length > 3 && (
                  <div style={{ color: '#637381' }}>
                    <Text variant="bodySm" as="p">
                      ... and {selectedProducts.length - 3} more products with their variants
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Price Changes"
        primaryAction={{
          content: 'Process Changes',
          onAction: handleProcessPriceChanges,
          loading: isProcessing,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowConfirmModal(false),
          },
        ]}
      >
        <Modal.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Banner tone="warning">
              <p>
                You are about to update prices for <strong>{selectedProducts.length} products</strong> 
                ({selectedProducts.reduce((total, product) => total + product.variants.length, 0)} variants total).
                This action will create a snapshot of current prices and update them according to your configuration.
              </p>
            </Banner>
            
            <div>
              <Text variant="headingSm" as="h4">Configuration Summary:</Text>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>Operation: {priceConfig.operation === 'increment' ? 'Increase' : 'Decrease'}</li>
                <li>Amount: {priceConfig.amount} {priceConfig.type === 'dollar' ? 'dollars' : 'percent'}</li>
                <li>Products affected: {selectedProducts.length}</li>
                <li>Collection: {collectionName}</li>
              </ul>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f6f6f7', 
              borderRadius: '4px',
              border: '1px solid #e1e3e5'
            }}>
              <Text variant="bodySm" as="p">
                <strong>Note:</strong> This operation will create before and after snapshots that can be used for rollback or repeat operations.
              </Text>
            </div>
          </div>
        </Modal.Section>
      </Modal>

      {/* History Modal */}
      <Modal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Price Change History"
        primaryAction={{
          content: 'Close',
          onAction: () => setShowHistoryModal(false),
        }}
      >
        <Modal.Section>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem', 
            maxHeight: 'calc(100vh - 200px)', // Account for modal header, footer, and padding
            overflow: 'hidden' // Prevent the outer container from scrolling
          }}>
            <Button onClick={loadPriceHistory} loading={isLoadingHistory}>
              Refresh History
            </Button>
            
            {isLoadingHistory ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" />
                <div style={{ marginTop: '1rem' }}>
                  <Text variant="bodyMd" as="p">
                    Loading price change history...
                  </Text>
                </div>
              </div>
            ) : (
              <div style={{ 
                flex: 1,
                overflowY: 'auto',
                paddingRight: '0.5rem', // Add some padding for the scrollbar
                minHeight: 0 // Allow flex item to shrink
              }}>
                {priceHistory.length === 0 ? (
                  <div style={{ color: '#637381' }}>
                    <Text variant="bodyMd" as="p">
                      No price change operations found.
                    </Text>
                  </div>
                ) : (
                  priceHistory.map((operation) => (
                    <div key={operation.operationId} style={{ 
                      padding: '1rem', 
                      border: '1px solid #e1e3e5', 
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Text variant="headingSm" as="h4">
                            {operation.collectionName}
                          </Text>
                          <Text variant="bodySm" as="p">
                            {new Date(operation.timestamp).toLocaleString()}
                          </Text>
                          <Text variant="bodySm" as="p">
                            By: {operation.userName} • Products: {operation.productsUpdated}
                          </Text>
                          <Text variant="bodySm" as="p">
                            Status: 
                            <span style={{ 
                              color: operation.status === 'completed' ? '#50b83c' : '#d82c0d',
                              marginLeft: '0.25rem'
                            }}>
                              {operation.status}
                            </span>
                          </Text>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button size="slim" onClick={() => handleRollback(operation.operationId)}>
                            Rollback
                          </Button>
                          <Button size="slim" onClick={() => handleRepeat(operation.operationId)}>
                            Repeat
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Modal.Section>
      </Modal>
    </Card>
  );
}
