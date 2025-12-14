import React, { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDb, Transaction } from '@/lib/db';
import { format } from 'date-fns';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
const COLORS = ['#00FF41', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
export function CompliancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  useEffect(() => {
    getDb().then(db => {
      db.transactions.find().sort({ timestamp: 'desc' }).exec()
        .then(txs => setTransactions(txs as Transaction[]))
        .finally(() => setIsFetching(false));
    });
  }, []);
  const eprData = useMemo(() => {
    const materialTotals: { [key: string]: { name: string; weight: number; value: number } } = transactions.reduce((acc, tx) => {
      if (!acc[tx.materialName]) {
        acc[tx.materialName] = { name: tx.materialName, weight: 0, value: 0 };
      }
      acc[tx.materialName].weight += tx.weight;
      acc[tx.materialName].value += tx.total;
      return acc;
    }, {} as { [key: string]: { name: string; weight: number; value: number } });
    return Object.values(materialTotals);
  }, [transactions]);
  const handleDownloadSaps = () => {
    const headers = "Date,SupplierID,Material,Weight(kg),Value(R)\n";
    const csvContent = transactions
      .map(tx => `${format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm')},${tx.supplierId},"${tx.materialName}",${tx.weight.toFixed(2)},${tx.total.toFixed(2)}`)
      .join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `SAPS_Register_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-display uppercase text-off-white">Compliance Hub</h1>
            <Button variant="industrial" onClick={handleDownloadSaps}><Download className="w-4 h-4 mr-2" />Download SAPS Register (CSV)</Button>
          </motion.div>
          <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardHeader><CardTitle>SAPS Register - Recent Entries</CardTitle></CardHeader><CardContent><ScrollArea className="h-[400px]"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Supplier ID</TableHead><TableHead>Material</TableHead><TableHead className="text-right">Weight (kg)</TableHead><TableHead className="text-right">Value (R)</TableHead></TableRow></TableHeader><TableBody>{isFetching ? (<TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>) : transactions.slice(0, 50).map(tx => (<TableRow key={tx.id}><TableCell className="font-mono">{format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm')}</TableCell><TableCell className="font-mono">{tx.supplierId}</TableCell><TableCell>{tx.materialName}</TableCell><TableCell className="text-right font-mono">{tx.weight.toFixed(2)}</TableCell><TableCell className="text-right font-mono">{tx.total.toFixed(2)}</TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent></Card>
            <Card><CardHeader><CardTitle>EPR Material Streams (by Weight)</CardTitle></CardHeader><CardContent className="h-[400px] flex flex-col items-center justify-center"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={eprData} dataKey="weight" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{eprData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#050505', border: '2px solid #333' }} formatter={(value) => `${Number(value).toFixed(2)} kg`} /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}