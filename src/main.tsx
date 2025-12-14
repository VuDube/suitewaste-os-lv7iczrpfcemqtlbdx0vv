import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css'
import { HardwareProvider } from '@/components/HardwareProvider';
import { PWAProvider } from '@/providers/PWAProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppRoutes } from '@/components/AppRoutes';
const queryClient = new QueryClient();
const container = document.getElementById('root')!;
let root = (container as any)._reactRootContainer;
if (!root) {
  root = createRoot(container);
  (container as any)._reactRootContainer = root;
}
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <HardwareProvider>
            <PWAProvider>
              <AppRoutes />
            </PWAProvider>
          </HardwareProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)