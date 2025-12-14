import React from 'react';
import { useRegisterSW } from '@/lib/pwa';
import { PWAInstallModal } from '@/components/PWAInstallModal';
export const PWAProvider = ({ children }: { children: React.ReactNode }) => {
  useRegisterSW();
  return (
    <>
      {children}
      <PWAInstallModal />
    </>
  );
};