import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDb, Material, Transaction } from '@/lib/db';
import { useHardware } from '@/hooks/useHardware';
import { Scale, ScanBarcode, PlusCircle, CheckCircle, Loader2, Maximize, Minimize, Camera } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SignatureCapture, SignatureCaptureHandle } from '@/components/SignatureCapture';
import { chatService } from '@/lib/chat';
import { Skeleton } from '@/components/ui/skeleton';
export function POSPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const { scaleWeight: weight, status: hardwareStatus, connectScale, disconnectScale, connectPrinter } = useHardware();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const sigCanvasRef = useRef<SignatureCaptureHandle>(null);
  useEffect(() => {
    getDb().then(db => {
      db.materials.find().exec()
        .then(materials => setMaterials(materials as Material[]))
        .finally(() => setMaterialsLoading(false));
    });
  }, []);
  const transactionTotal = useMemo(() => {
    if (!selectedMaterial || weight <= 0) return 0;
    return parseFloat((weight * selectedMaterial.currentPrice).toFixed(2));
  }, [selectedMaterial, weight]);
  const handleAiGrade = async () => {
    setIsGrading(true);
    setAiSuggestion('');
    toast.info('AI Grading Started', { description: 'Analyzing mock e-waste image...' });
    try {
      chatService.newSession();
      let responseText = '';
      await chatService.sendMessage(
        "Classify this e-waste item from a mock image. Categories: Motherboards, Power Supplies, Mixed Electronics, Cables.",
        undefined,
        (chunk) => { responseText += chunk; }
      );
      setAiSuggestion(responseText.trim());
      toast.success('AI Suggestion', { description: `Suggested Category: ${responseText.trim()}` });
    } catch (error) {
      toast.error('AI Grading Failed');
    } finally {
      setIsGrading(false);
    }
  };
  const printReceipt = async (tx: Transaction) => {
    try {
      await connectPrinter(); // From useHardware
      await new Promise(r => setTimeout(r, 500)); // Mock print delay
      toast.success('Receipt Printed (Mock)');
    } catch {
      toast.error('Print Failed');
    }
  };
  const handleAddTransaction = async () => {
    if (materialsLoading) return;
    if (!selectedMaterial || !supplierId || weight <= 0) {
      toast.error('Missing Information', { description: 'Please select a material, enter a supplier ID, and ensure weight is greater than zero.' });
      return;
    }
    if (sigCanvasRef.current?.isEmpty()) {
      toast.error('Signature Required', { description: 'Please capture the supplier\'s signature before saving.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const db = await getDb();
      const signatureData = sigCanvasRef.current?.toDataURL();
      const newTransaction: Omit<Transaction, '_deleted'> = {
        id: crypto.randomUUID(),
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        weight: weight,
        pricePerKg: selectedMaterial.currentPrice,
        total: transactionTotal,
        supplierId: supplierId,
        timestamp: Date.now(),
        signatureData: signatureData,
      };
      await db.transactions.insert(newTransaction as Transaction);
      toast.success('Transaction Saved', { description: `${selectedMaterial.name} (${weight}kg) for R${transactionTotal} has been recorded.`, icon: <CheckCircle className="w-5 h-5" /> });
      await printReceipt(newTransaction as Transaction);
      setSelectedMaterial(null);
      setSupplierId('');
      setAiSuggestion('');
      sigCanvasRef.current?.clear();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      toast.error('Submission Failed', { description: 'Could not save the transaction to the local database.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const PageContent = () => (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12", fullscreen && "max-w-full px-2 py-2")}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Select Material</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setFullscreen(!fullscreen)}>
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {materialsLoading ? (Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)) : (materials.map(material => (<Button key={material.id} variant="outline" className={cn("h-24 text-base flex flex-col justify-center items-center text-center p-2", selectedMaterial?.id === material.id ? 'bg-neon-green text-industrial-black border-neon-green' : 'border-border')} onClick={() => setSelectedMaterial(material)}><span className="font-bold">{material.name}</span><span className="font-mono text-xs">R{material.currentPrice.toFixed(2)}/kg</span></Button>)))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>AI Assist</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <Button variant="outline" onClick={handleAiGrade} disabled={isGrading}><Camera className="w-4 h-4 mr-2" /> Grade with Camera (Mock)</Button>
              {isGrading && <Loader2 className="w-5 h-5 animate-spin" />}
              {aiSuggestion && <p className="text-neon-green font-mono">Suggestion: {aiSuggestion}</p>}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-2"><ScanBarcode className="w-5 h-5 text-muted-foreground" /><Input placeholder="Supplier ID (Scan/Type)" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="font-mono" /></div><div className="p-4 border-2 border-border text-center"><p className="text-sm uppercase text-muted-foreground">Live Weight</p><p className="text-5xl font-mono font-bold text-neon-green">{weight.toFixed(2)}<span className="text-2xl">kg</span></p></div>{selectedMaterial && (<div className="p-4 border-2 border-border text-center"><p className="text-sm uppercase text-muted-foreground">Total Payment</p><p className="text-5xl font-mono font-bold text-off-white">R{transactionTotal.toFixed(2)}</p><p className="text-xs text-muted-foreground">{selectedMaterial.name} @ R{selectedMaterial.currentPrice.toFixed(2)}/kg</p></div>)}<div><p className="text-sm uppercase text-muted-foreground mb-2">Supplier Signature</p><SignatureCapture ref={sigCanvasRef} /></div><Button variant="industrial" size="lg" className="w-full" onClick={handleAddTransaction} disabled={isSubmitting || !selectedMaterial || !supplierId || weight <= 0}><PlusCircle className="w-5 h-5 mr-2" />{isSubmitting ? 'Saving...' : 'Add Transaction'}</Button></CardContent></Card>
          <Card><CardHeader><CardTitle>Hardware Status</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Scale className="w-5 h-5" /><span>Scale</span><span className={cn("text-xs font-bold uppercase px-2 py-0.5", hardwareStatus.scale === 'connected' && 'bg-neon-green text-industrial-black', hardwareStatus.scale === 'disconnected' && 'bg-gray-500 text-white', hardwareStatus.scale === 'error' && 'bg-safety-red text-white', hardwareStatus.scale === 'mock' && 'bg-yellow-500 text-black',)}>{hardwareStatus.scale}</span></div><Button size="sm" variant={hardwareStatus.scale === 'disconnected' || hardwareStatus.scale === 'error' ? 'industrial' : 'destructive'} onClick={hardwareStatus.scale === 'disconnected' || hardwareStatus.scale === 'error' ? connectScale : disconnectScale}>{hardwareStatus.scale === 'disconnected' || hardwareStatus.scale === 'error' ? 'Connect' : 'Disconnect'}</Button></div></CardContent></Card>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <Toaster position="top-center" richColors />
      {fullscreen ? <div className="bg-industrial-black h-screen w-screen"><PageContent /></div> : <AppLayout><PageContent /></AppLayout>}
    </>
  );
}