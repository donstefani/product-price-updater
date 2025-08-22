import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { HomePage } from '@/pages/HomePage';
import { AppBridgeProviderWrapper } from '@/components/common/AppBridgeProvider';

// Global styles to ensure full width
const globalStyles = `
  body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: 100%;
  }
  
  #root {
    min-height: 100vh;
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppBridgeProviderWrapper>
      <AppProvider i18n={{}}>
        <HomePage />
      </AppProvider>
    </AppBridgeProviderWrapper>
  </React.StrictMode>,
);
