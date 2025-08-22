
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, Text, Badge, Thumbnail, Button } from '@shopify/polaris';
import { ShopifyProduct } from '@/types/shopify';

// Dropdown variant list component
function VariantList({ variants, options, isExpanded, onToggle }: { 
  variants: any[], 
  options: any[],
  isExpanded: boolean, 
  onToggle: (e?: React.MouseEvent) => void 
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isExpanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isExpanded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        // Check if click is outside the dropdown as well
        const dropdownElement = document.querySelector('[data-variant-dropdown]');
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          onToggle();
        }
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, onToggle]);

  return (
    <div style={{ position: 'relative', marginTop: '0.5rem' }}>
      <button
        ref={buttonRef}
        onClick={onToggle}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '12px',
          color: '#008060',
          padding: '0.25rem 0',
        }}
      >
        <span>{variants.length} variants</span>
        <span style={{ 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: '10px'
        }}>
          ▼
        </span>
      </button>
      
      {isExpanded && createPortal(
        <div 
          data-variant-dropdown
          style={{ 
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: Math.max(dropdownPosition.width, 400),
            zIndex: 99999,
            padding: '0.75rem',
            backgroundColor: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            border: '1px solid #e1e3e5',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#637381',
              padding: '0.25rem',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px'
            }}
            title="Close"
          >
            ✕
          </button>
          {/* Product Options */}
          {options.length > 0 && (
            <div style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e1e3e5' }}>
              <div style={{ color: '#637381' }}>
                <Text variant="bodySm" as="span" fontWeight="bold">
                  Options:
                </Text>
              </div>
              {options.map((option) => (
                <div key={option.id} style={{ marginTop: '0.25rem' }}>
                  <Text variant="bodySm" as="span" fontWeight="bold">
                    {option.name}:
                  </Text>
                  <span style={{ marginLeft: '0.25rem' }}>
                    <Text variant="bodySm" as="span">
                      {option.values.join(', ')}
                    </Text>
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Variants */}
          {variants.map((variant) => (
            <div key={variant.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.25rem 0',
              borderBottom: '1px solid #e1e3e5'
            }}>
              <div>
                <Text variant="bodySm" as="span" fontWeight="bold">
                  {variant.title}
                </Text>
                <br />
                <div style={{ color: '#637381' }}>
                  <Text variant="bodySm" as="span">
                    SKU: {variant.sku}
                  </Text>
                </div>
                {/* Show selected options for this variant */}
                {variant.selected_options && variant.selected_options.length > 0 && (
                  <div style={{ color: '#637381', fontSize: '10px' }}>
                    {variant.selected_options.map((option: any, index: number) => (
                      <div key={index}>
                        {option.name}: {option.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text variant="bodySm" as="span" fontWeight="bold">
                  ${variant.price}
                </Text>
                {variant.compare_at_price && variant.compare_at_price !== variant.price && (
                  <div>
                    <div style={{ 
                      textDecoration: 'line-through', 
                      color: '#637381',
                      marginRight: '0.5rem'
                    }}>
                      <Text variant="bodySm" as="span">
                        ${variant.compare_at_price}
                      </Text>
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ color: '#637381' }}>
                    <Text variant="bodySm" as="span">
                      Stock: {variant.inventory_quantity}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

interface ProductGridProps {
  products: ShopifyProduct[];
  onProductSelect?: (product: ShopifyProduct) => void;
  onProductsSelect?: (products: ShopifyProduct[]) => void;
}

export function ProductGrid({ products, onProductSelect, onProductsSelect }: ProductGridProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Reset expanded products and selected products when products change (new collection selected)
  useEffect(() => {
    setExpandedProducts(new Set());
    setSelectedProducts(new Set());
  }, [products]);

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    
    // Notify parent of selection change
    if (onProductsSelect) {
      const selectedProductList = products.filter(p => newSelected.has(p.id));
      onProductsSelect(selectedProductList);
    }
  };

  const selectAllProducts = () => {
    const allProductIds = new Set(products.map(p => p.id));
    setSelectedProducts(allProductIds);
    
    // Notify parent of selection change
    if (onProductsSelect) {
      onProductsSelect(products);
    }
  };

  const clearAllSelections = () => {
    setSelectedProducts(new Set());
    
    // Notify parent of selection change
    if (onProductsSelect) {
      onProductsSelect([]);
    }
  };

  if (products.length === 0) {
    return (
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Text variant="bodyMd" as="p">
            No products found in this collection.
          </Text>
        </div>
      </Card>
    );
  }



  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {products.map((product) => {
        const isSelected = selectedProducts.has(product.id);
        return (
          <div
            key={product.id}
            style={{
              backgroundColor: isSelected ? '#e6faf4' : 'white',
              border: isSelected ? '2px solid #008060' : '1px solid #e1e3e5',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              overflow: 'visible',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div 
              style={{ 
                padding: '0.75rem',
                backgroundColor: isSelected ? '#e6faf4' : 'white'
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {product.images.length > 0 && (
                  <Thumbnail
                    source={product.images[0].src}
                    alt={product.images[0].alt}
                    size="medium"
                  />
                )}
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <Badge tone="success">
                      {product.status}
                    </Badge>
                    <Text variant="headingSm" as="h3">
                      {product.title}
                    </Text>
                  </div>
                  
                  <VariantList 
                    variants={product.variants}
                    options={product.options}
                    isExpanded={expandedProducts.has(product.id)}
                    onToggle={(e) => {
                      if (e) e.stopPropagation(); // Prevent card selection when clicking variant toggle
                      toggleProductExpansion(product.id);
                    }}
                  />
                </div>
                
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {product.variants.length > 0 && (
                    <Text variant="headingMd" as="p">
                      ${product.variants[0].price}
                    </Text>
                  )}
                  {onProductSelect && (
                    <Button 
                      size="slim"
                      onClick={() => {
                        toggleProductSelection(product.id);
                      }}
                    >
                      {selectedProducts.has(product.id) ? 'Clear' : 'Select'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Product Count and Selection Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: '#637381' }}>
            <Text variant="bodySm" as="span">
              {products.length} product{products.length !== 1 ? 's' : ''}
            </Text>
          </div>
          {selectedProducts.size > 0 && (
            <div style={{ color: '#008060' }}>
              <Text variant="bodySm" as="span">
                ({selectedProducts.size} selected)
              </Text>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectedProducts.size > 0 && (
            <Button 
              size="slim"
              variant="secondary"
              onClick={clearAllSelections}
            >
              Clear All
            </Button>
          )}
          <Button 
            size="slim"
            variant="primary"
            onClick={selectAllProducts}
          >
            Select All
          </Button>
        </div>
      </div>

      {/* Product Display */}
      {renderListView()}
    </div>
  );
}
