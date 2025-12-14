import React, { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDb, GLEntry, Staff } from '@/lib/db';
import { format } from 'date-fns';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
const HOURLY_RATE = 18.00; // Mock hourly rate for payroll
const COLORS = ['#00FF41', '#FF3333', '#FFBB28'];
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
export function FinancePage() {
  const [glEntries, setGlEntries] = useState<GLEntry[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      const db = await getDb();
      const [glData, staffData] = await Promise.all([
        db.gl_entries.find().sort({ timestamp: 'desc' }).exec() as Promise<GLEntry[]>,
        db.staff.find({ selector: { clockedIn: true } }).exec() as Promise<Staff[]>
      ]);
      setGlEntries(glData);
      setStaff(staffData);
      setLoading(false);
    };
    fetchData();
  }, []);
  const { totalRevenue, totalExpenses } = useMemo(() => {
    return glEntries.reduce((acc, entry) => {
      if (entry.account === 'Inventory') {
        acc.totalRevenue += entry.debit; // We treat inventory purchases as revenue for simplicity here
      } else if (entry.account === 'Expenses') {
        acc.totalExpenses += entry.debit;
      }
      return acc;
    }, { totalRevenue: 0, totalExpenses: 0 });
  }, [glEntries]);
  const totalPayroll = useMemo(() => {
    return staff.reduce((acc, employee) => {
      if (employee.shiftStart) {
        const hoursWorked = (Date.now() - employee.shiftStart) / (1000 * 60 * 60);
        return acc + (hoursWorked * HOURLY_RATE);
      }
      return acc;
    }, 0);
  }, [staff]);
  const pieData = [
    { name: 'Total Revenue', value: totalRevenue },
    { name: 'Expenses', value: totalExpenses },
    { name: 'Est. Payroll', value: totalPayroll },
  ];
  const netProfit = totalRevenue - totalExpenses - totalPayroll;
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1 variants={itemVariants} className="text-3xl font-bold font-display uppercase text-off-white">Finance Module</motion.h1>
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader><CardContent><p className="text-4xl font-mono font-bold text-neon-green">R {totalRevenue.toFixed(2)}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Total Expenses</CardTitle></CardHeader><CardContent><p className="text-4xl font-mono font-bold text-safety-red">R {(totalExpenses + totalPayroll).toFixed(2)}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Net Profit</CardTitle></CardHeader><CardContent><p className={`text-4xl font-mono font-bold ${netProfit >= 0 ? 'text-neon-green' : 'text-safety-red'}`}>R {netProfit.toFixed(2)}</p></CardContent></Card>
          </motion.div>
          <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardHeader><CardTitle>General Ledger - Recent Entries</CardTitle></CardHeader><CardContent><ScrollArea className="h-[400px]"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader><TableBody>{loading ? (<TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>) : glEntries.map(entry => (<TableRow key={entry.id}><TableCell className="font-mono">{format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm')}</TableCell><TableCell>{entry.account}</TableCell><TableCell className="text-right font-mono text-neon-green">{entry.debit > 0 ? `R ${entry.debit.toFixed(2)}` : '-'}</TableCell><TableCell className="text-right font-mono text-safety-red">{entry.credit > 0 ? `R ${entry.credit.toFixed(2)}` : '-'}</TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent></Card>
            <Card><CardHeader><CardTitle>Profit & Loss Summary</CardTitle></CardHeader><CardContent className="h-[400px] flex flex-col items-center justify-center"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#050505', border: '2px solid #333' }}/><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}