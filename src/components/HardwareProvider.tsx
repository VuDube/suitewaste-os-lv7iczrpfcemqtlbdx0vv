import React, { ReactNode, useState } from 'react';
import { useSerialScale } from '@/hooks/useSerialScale';
import { HardwareStatus } from '@/lib/db';
import { HardwareContext, HardwareContextType } from '@/hooks/useHardware';
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
  const value: HardwareContextType = {
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