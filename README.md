# Product Price Updater - Shopify Embedded App

A Shopify embedded app for bulk updating product prices with a clean, modern UI built using Polaris.

## Features

- Collection search and selection
- Product listing and filtering
- Bulk price updates (coming soon)
- Modern React + TypeScript architecture
- Shopify Polaris UI components

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shopify Polaris
- **Shopify Integration**: App Bridge

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   - Copy `env.example` to `.env`
   - Add your Shopify app credentials and configuration

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Build:**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # UI Components
│   ├── common/         # Reusable components
│   ├── collections/    # Collection-related components
│   ├── products/       # Product-related components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # App constants
└── pages/              # Main page components
```

## Development

The app follows the Single Responsibility Principle with well-organized, reusable components. Each component is designed to be simple and easy to understand.
