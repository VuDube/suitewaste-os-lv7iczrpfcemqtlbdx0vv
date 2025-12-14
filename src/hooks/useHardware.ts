import React, { createContext, useContext } from 'react';
import { HardwareStatus } from '@/lib/db';
export interface HardwareContextType {
  status: HardwareStatus;
  scaleWeight: number;
  connectScale: () => Promise<void>;
  disconnectScale: () => Promise<void>;
  connectPrinter: () => Promise<void>;
  togglePrinterStatus: () => void; // For mock
}
export const HardwareContext = createContext<HardwareContextType | undefined>(undefined);
export const useHardware = (): HardwareContextType => {
  const context = useContext(HardwareContext);
  if (context === undefined) {
    throw new Error('useHardware must be used within a HardwareProvider');
  }
  return context;
};