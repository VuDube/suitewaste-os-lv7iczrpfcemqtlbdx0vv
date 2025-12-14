import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useInstallPrompt } from '@/lib/pwa';
export const PWAInstallModal = () => {
  const { deferredPrompt, promptInstall } = useInstallPrompt();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (deferredPrompt) {
      setIsOpen(true);
    }
  }, [deferredPrompt]);
  const handleInstallClick = () => {
    promptInstall();
    setIsOpen(false);
  };
  const handleClose = () => {
    setIsOpen(false);
  };
  if (!isOpen) {
    return null;
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-industrial-black border-2 border-border text-off-white">
        <DialogHeader>
          <DialogTitle className="text-neon-green font-display text-2xl">Install SuiteWaste OS</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            For the best experience and full offline access, install the SuiteWaste OS app on your device.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Installing the app adds it to your home screen or desktop, enabling faster access and reliable offline functionality.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Not Now</Button>
          <Button variant="industrial" onClick={handleInstallClick}>
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};