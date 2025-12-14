import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getDb, Transaction } from '@/lib/db';
import { chatService } from '@/lib/chat';
import { Toaster, toast } from 'sonner';
import { Sparkles, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
const ListingSkeleton = () => (
    <Card className="overflow-hidden flex flex-col">
        <Skeleton className="h-48 w-full" />
        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
        <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent>
        <CardFooter className="flex justify-between pt-4 border-t-2 border-border">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/3" />
        </CardFooter>
    </Card>
);
export function MarketplacePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [aiCategory, setAiCategory] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  useEffect(() => {
    getDb().then(db => {
        db.transactions.find().exec()
            .then(txs => setTransactions(txs as Transaction[]))
            .finally(() => setIsLoading(false));
    });
  }, []);
  const handleAiGrade = async () => {
    if (!description.trim()) {
      toast.error('Please provide a description.');
      return;
    }
    setIsGrading(true);
    setAiCategory('');
    try {
      chatService.newSession(); // Use a fresh session for classification
      await chatService.sendMessage(
        `You are an e-waste classification expert. Briefly classify the following item into a common e-waste category (e.g., "Motherboards", "Power Supplies", "Mixed Electronics"). Description: "${description}"`,
        undefined,
        (chunk) => { setAiCategory(prev => prev + chunk); }
      );
    } catch (error) {
      console.error('AI grading failed:', error);
      toast.error('AI Grading Failed', { description: 'Could not connect to the AI service.' });
    } finally {
      setIsGrading(false);
    }
  };
  const listings = useMemo(() => transactions
    .filter(tx => tx.weight > 50)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6)
    .map(tx => ({
    id: tx.id,
    title: `${tx.materialName} Bale`,
    description: `A large bale of processed ${tx.materialName.toLowerCase()}.`,
    weight: tx.weight,
    price: tx.total * 1.25, // Mock 25% markup
    imageUrl: `https://placehold.co/600x400/050505/00FF41/png?text=${encodeURIComponent(tx.materialName)}`,
  })), [transactions]);
  return (
    <AppLayout>
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1 variants={itemVariants} className="text-3xl font-bold font-display uppercase text-off-white">E-Waste Marketplace</motion.h1>
          <motion.div variants={itemVariants}><Card><CardHeader><CardTitle>Create New Listing</CardTitle></CardHeader><CardContent className="space-y-4"><Textarea placeholder="Describe the e-waste item or lot (e.g., 'Pallet of assorted PC towers, mixed condition')..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /><div className="flex items-center gap-4"><Button variant="industrial" onClick={handleAiGrade} disabled={isGrading}><Sparkles className={`w-4 h-4 mr-2 ${isGrading ? 'animate-spin' : ''}`} />{isGrading ? 'Analyzing...' : 'AI Grade Category'}</Button>{aiCategory && (<div className="flex items-center gap-2 text-neon-green"><Tag className="w-5 h-5" /><span className="font-mono font-bold">{aiCategory}</span></div>)}</div></CardContent><CardFooter><Button disabled={!aiCategory}>Publish Listing (Mock)</Button></CardFooter></Card></motion.div>
          <motion.div variants={itemVariants}><h2 className="text-2xl font-bold font-display uppercase text-off-white mb-4">Recent High-Volume Lots</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{isLoading ? (Array.from({ length: 3 }).map((_, i) => <ListingSkeleton key={i} />)) : (listings.map(item => (<Card key={item.id} className="overflow-hidden flex flex-col"><img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" /><CardHeader><CardTitle className="text-base">{item.title}</CardTitle></CardHeader><CardContent className="flex-grow"><p className="text-sm text-muted-foreground">{item.description}</p></CardContent><CardFooter className="flex justify-between font-mono text-sm border-t-2 border-border pt-4"><span>{item.weight.toFixed(2)} kg</span><span className="text-neon-green font-bold">R {item.price.toFixed(2)}</span></CardFooter></Card>)))}</div></motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}