import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHardware } from '@/hooks/useHardware';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HardDrive, Printer, Camera, Video } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChatHub } from '@/components/ChatHub';
import { Toaster, toast } from 'sonner';
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
export function SettingsPage() {
  const { status, connectScale, disconnectScale, togglePrinterStatus } = useHardware();
  const [camIp, setCamIp] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  const [isFetchingSnapshot, setIsFetchingSnapshot] = useState(false);
  const testSerial = async () => {
    if (status.scale === 'disconnected' || status.scale === 'error') {
      toast.info('Attempting to connect to scale...');
      await connectScale();
    } else {
      toast.info('Disconnecting from scale...');
      await disconnectScale();
    }
  };
  const testUSB = () => {
    togglePrinterStatus();
    toast.success(`Mock Printer Status Toggled`, {
      description: `Status is now: ${status.printer === 'connected' ? 'disconnected' : 'connected'}`
    });
  };
  const testSnapshot = async () => {
    setIsFetchingSnapshot(true);
    setImgSrc('');
    try {
      // In a real scenario, a worker would fetch this to bypass CORS.
      // Here, we mock it with a placeholder.
      await new Promise(res => setTimeout(res, 1000));
      const mockUrl = `https://placehold.co/640x480/050505/E5E5E5/png?text=Snapshot+from+${camIp || 'MockCam'}`;
      setImgSrc(mockUrl);
      toast.success('Snapshot fetched successfully (mocked).');
    } catch (error) {
      toast.error('Failed to fetch snapshot.');
    } finally {
      setIsFetchingSnapshot(false);
    }
  };
  return (
    <AppLayout>
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="text-3xl font-bold font-display uppercase text-off-white">
            Settings & Diagnostics
          </motion.h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={itemVariants} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Hardware Diagnostics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border-2 border-border">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-6 h-6 text-neon-green" />
                      <div>
                        <p className="font-bold">Industrial Scale (Web Serial)</p>
                        <p className={cn("text-sm font-mono uppercase", status.scale === 'connected' ? 'text-neon-green' : 'text-muted-foreground')}>
                          Status: {status.scale}
                        </p>
                      </div>
                    </div>
                    <Button variant="industrial" onClick={testSerial}>
                      {status.scale === 'connected' || status.scale === 'connecting' ? 'Disconnect Test' : 'Connect Test'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border-2 border-border">
                    <div className="flex items-center gap-3">
                      <Printer className="w-6 h-6 text-neon-green" />
                      <div>
                        <p className="font-bold">Receipt Printer (WebUSB)</p>
                        <p className={cn("text-sm font-mono uppercase", status.printer === 'connected' ? 'text-neon-green' : 'text-muted-foreground')}>
                          Status: {status.printer} (Mock)
                        </p>
                      </div>
                    </div>
                    <Button variant="industrial" onClick={testUSB}>
                      Toggle Mock Connection
                    </Button>
                  </div>
                  <div className="p-3 border-2 border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <Camera className="w-6 h-6 text-neon-green" />
                      <div>
                        <p className="font-bold">IP Camera (HTTP)</p>
                        <p className="text-sm text-muted-foreground">Test connection to an audit camera.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="e.g., 192.168.1.100" value={camIp} onChange={(e) => setCamIp(e.target.value)} />
                      <Button variant="industrial" onClick={testSnapshot} disabled={isFetchingSnapshot}>
                        <Video className="w-4 h-4 mr-2" />
                        {isFetchingSnapshot ? 'Fetching...' : 'Test Snapshot'}
                      </Button>
                    </div>
                    {imgSrc && <img src={imgSrc} alt="Camera Snapshot" className="mt-2 border-2 border-border w-full" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting & Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>AI Assistant</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-4">
                          Ask the AI for help with troubleshooting, material identification, or general questions about SuiteWaste OS.
                        </p>
                        <ChatHub initPrompt="Give me a step-by-step guide for troubleshooting a scale that won't connect." />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Scale Not Connecting?</AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          <li>Ensure the scale is powered on and connected via USB.</li>
                          <li>Click "Connect Test" and select the correct serial port from the browser pop-up (often labeled "USB-SERIAL CH340" or similar).</li>
                          <li>If the pop-up doesn't appear, check your browser's site settings to ensure it can access serial ports.</li>
                          <li>Try a different USB port on your device.</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}