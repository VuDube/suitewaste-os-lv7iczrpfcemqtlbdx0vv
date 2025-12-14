import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useSerialScale } from './useSerialScale';
import { HardwareStatus } from '@/lib/db';
interface HardwareContextType {
  status: HardwareStatus;
  scaleWeight: number;
  connectScale: () => Promise<void>;
  disconnectScale: () => Promise<void>;
  connectPrinter: () => Promise<void>;
  togglePrinterStatus: () => void; // For mock
}
const HardwareContext = createContext<HardwareContextType | undefined>(undefined);
export const HardwareProvider = ({ children }: { children: ReactNode }) => {
  const { weight: scaleWeight, status: scaleStatus, connect: connectScale, disconnect: disconnectScale } = useSerialScale();
  const [printerStatus, setPrinterStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  // Mock printer connection for now
  const connectPrinter = async () => {
    console.log('Attempting to connect to printer...');
    // In a real implementation, this would use WebUSB API
    setPrinterStatus('connected');
  };
  const togglePrinterStatus = () => {
    setPrinterStatus(prev => prev === 'connected' ? 'disconnected' : 'connected');
  }
  const value = {
    status: {
      scale: scaleStatus,
      printer: printerStatus,
      camera: 'disconnected' as const,
    },
    scaleWeight,
    connectScale,
    disconnectScale,
    connectPrinter,
    togglePrinterStatus,
  };
  return (
    <HardwareContext.Provider value={value}>
      {children}
    </HardwareContext.Provider>
  );
};
export const useHardware = (): HardwareContextType => {
  const context = useContext(HardwareContext);
  if (context === undefined) {
    throw new Error('useHardware must be used within a HardwareProvider');
  }
  return context;
};