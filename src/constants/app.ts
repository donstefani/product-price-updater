export const APP_CONFIG = {
  name: 'Product Price Updater',
  version: '1.0.0',
  defaultPageSize: 20,
  maxPageSize: 250,
} as const;

export const GRID_BREAKPOINTS = {
  xs: 12,
  sm: 6,
  md: 4,
  lg: 3,
  xl: 2,
} as const;

export const PRODUCT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
  { label: 'Draft', value: 'draft' },
] as const;
