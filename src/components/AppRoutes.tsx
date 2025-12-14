import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { POSPage } from '@/pages/POSPage';
import { FinancePage } from '@/pages/FinancePage';
import { HRPage } from '@/pages/HRPage';
import { LogisticsPage } from '@/pages/LogisticsPage';
import { CompliancePage } from '@/pages/CompliancePage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { ProducerPortalPage } from '@/pages/ProducerPortalPage';
import { LoginPage } from '@/pages/LoginPage';
const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
  { path: "/", element: <ProtectedRoute><HomePage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/pos", element: <ProtectedRoute><POSPage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/finance", element: <ProtectedRoute><FinancePage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/hr", element: <ProtectedRoute><HRPage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/logistics", element: <ProtectedRoute><LogisticsPage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/compliance", element: <ProtectedRoute><CompliancePage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/marketplace", element: <ProtectedRoute><MarketplacePage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/settings", element: <ProtectedRoute><SettingsPage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/chat", element: <ProtectedRoute><ChatPage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
  { path: "/portal", element: <ProtectedRoute><ProducerPortalPage /></ProtectedRoute>, errorElement: <RouteErrorBoundary /> },
]);
export function AppRoutes() {
  return <RouterProvider router={router} />;
}