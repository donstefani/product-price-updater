import { useState } from 'react';
import { TextField, Card, Button, Text } from '@shopify/polaris';
import { ShopifyCollection } from '@/types/shopify';
import { useShopifyAuth } from '@/hooks/useShopifyAuth';

interface CollectionSearchProps {
  onCollectionSelect: (collection: ShopifyCollection) => void;
}

export function CollectionSearch({ onCollectionSelect }: CollectionSearchProps) {
  const { shop, serverApiService } = useShopifyAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<ShopifyCollection | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);

  const handleSearch = async () => {
    console.log('Search triggered:', { searchTerm, shop, serverApiService: !!serverApiService });
    
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    if (!shop || !serverApiService) {
      setError('Shop or API service not available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsSearchExpanded(true); // Ensure search results are expanded when searching
    
    try {
      console.log('Fetching collections from server API');
      
      // Use the server API service to get all collections
      const response = await serverApiService.getCollections(50);
      const allCollections = response.collections;
      
      // Filter collections based on search term
      const filteredCollections = allCollections.filter((collection) => {
        const titleMatch = collection.title.toLowerCase().includes(searchTerm.toLowerCase());
        const handleMatch = collection.handle.toLowerCase().includes(searchTerm.toLowerCase());
        console.log(`Collection "${collection.title}": titleMatch=${titleMatch}, handleMatch=${handleMatch}`);
        return titleMatch || handleMatch;
      });
      
      console.log('Search results:', filteredCollections);
      setCollections(filteredCollections);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectionSelect = (collection: ShopifyCollection) => {
    setSelectedCollection(collection);
    setIsSearchExpanded(false);
    onCollectionSelect(collection);
  };

  return (
    <Card>
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Text variant="headingMd" as="h2">
            Search Collections
          </Text>
          
          {error && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fef7f7', 
              border: '1px solid #d82c0d', 
              borderRadius: '4px',
              color: '#d82c0d'
            }}>
              <Text variant="bodySm" as="p">{error}</Text>
            </div>
          )}
          
          {/* Search Input - Always Visible */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div 
              style={{ flex: 1 }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearch();
                }
              }}
            >
              <TextField
                label="Collection name"
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Enter collection name..."
                autoComplete="off"
              />
            </div>
            <Button 
              variant="primary"
              onClick={handleSearch}
              loading={isLoading}
            >
              Search
            </Button>
          </div>

          {/* Results Summary Row - When Collection Selected */}
          {selectedCollection && !isSearchExpanded && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: '#f6f6f7',
              border: '1px solid #c9cccf',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Text variant="bodyMd" as="span">
                  Results:
                </Text>
                <Text variant="headingSm" as="span">
                  {selectedCollection.title}
                </Text>
                <Text variant="bodyMd" as="span">
                  Collection
                </Text>
              </div>
              <button
                onClick={() => setIsSearchExpanded(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '14px',
                  color: '#008060',
                  padding: '0.5rem',
                }}
              >
                <span style={{ 
                  transform: 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  fontSize: '12px'
                }}>
                  ▼
                </span>
              </button>
            </div>
          )}

          {/* Search Results - Collapsible */}
          {isSearchExpanded && collections.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.5rem 0'
              }}>
                <Text variant="headingSm" as="h3">
                  Results ({collections.length})
                </Text>
                {selectedCollection && (
                  <button
                    onClick={() => setIsSearchExpanded(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '14px',
                      color: '#008060',
                      padding: '0.5rem',
                    }}
                  >
                    <span style={{ 
                      transform: 'rotate(180deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '12px'
                    }}>
                      ▼
                    </span>
                  </button>
                )}
              </div>
              {collections.map((collection) => (
                <Card key={collection.id}>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <Text variant="headingSm" as="h4">
                        {collection.title}
                      </Text>
                      <Button 
                        size="slim"
                        onClick={() => handleCollectionSelect(collection)}
                      >
                        Select Collection
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          

        </div>
      </div>
    </Card>
  );
}
