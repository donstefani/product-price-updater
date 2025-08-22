# Product Price Updater - Frontend

React-based Shopify app frontend for product price management. Built with Vite, TypeScript, and Shopify App Bridge for seamless integration with the Shopify admin interface.

## Features

- Product search and filtering
- Bulk price updates
- Real-time Shopify integration via App Bridge
- TypeScript for type safety
- Vite for fast development and building

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Shopify Polaris** for UI components
- **Shopify App Bridge** for admin integration
- **Node.js 22** compatible

## Development

### Prerequisites

- Node.js 22 or higher
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

This app is automatically deployed to GitHub Pages via GitHub Actions.

### Manual Deployment

1. Build the app:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist/` directory

### GitHub Pages

The app is automatically deployed to GitHub Pages when you push to the `main` branch. The deployment URL will be:
`https://[your-username].github.io/product-price-updater-frontend/`

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SHOPIFY_API_KEY=your_shopify_api_key
VITE_SHOPIFY_SHOP_DOMAIN=your_shop_domain
```

## Project Structure

```
src/
├── components/          # React components
│   ├── collections/     # Collection-related components
│   ├── common/          # Shared components
│   ├── layout/          # Layout components
│   └── products/        # Product-related components
├── constants/           # App constants
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── services/            # API and external services
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
