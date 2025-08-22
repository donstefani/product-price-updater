import React from 'react';
import { Page, Layout } from '@shopify/polaris';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title = 'Product Price Updater' }: AppLayoutProps) {
  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      <Page title={title}>
        <Layout>
          <Layout.Section>
            {children}
          </Layout.Section>
        </Layout>
      </Page>
    </div>
  );
}
