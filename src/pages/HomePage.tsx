import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertTriangle, BarChart, Weight, Wifi, WifiOff, RefreshCw, History } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Transaction, AuditLog, getDb, SuiteWasteDatabase } from '@/lib/db';
import { useAutoSync } from '@/lib/sync';
import { startOfToday, subHours, format } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
const mockFraudAlerts = [
    { id: 1, message: "Split-load detected: Supplier #1023", time: "2m ago", level: "high" },
    { id: 2, message: "Unusual material weight: Copper", time: "15m ago", level: "medium" },
    { id: 3, message: "After-hours weigh-in: Operator #5", time: "1h ago", level: "low" },
];
const StatCard = ({ title, value, icon: Icon, change, changeType }: { title: string, value: string, icon: React.ElementType, change: string, changeType: 'increase' | 'decrease' }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{title}</CardTitle>
                <Icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold font-mono text-off-white">{value}</div>
                <p className={`text-xs ${changeType === 'increase' ? 'text-neon-green' : 'text-safety-red'}`}>{change}</p>
            </CardContent>
        </Card>
    </motion.div>
);
export function HomePage() {
  const [db, setDb] = useState<SuiteWasteDatabase | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  useEffect(() => {
    const fetchData = async () => {
        const dbInstance = await getDb();
        setDb(dbInstance);
        const txData = await dbInstance.transactions.find({ selector: { timestamp: { $gte: startOfToday().getTime() } } }).exec() as Transaction[];
        setTransactions(txData);
        const auditData = await dbInstance.audit_logs.find().sort({ timestamp: 'desc' }).limit(5).exec() as AuditLog[];
        setAudits(auditData);
    };
    fetchData();
  }, []);
  const { isSyncing, syncNow, lastSync, isOnline } = useAutoSync(db);
  const todayTotal = transactions.reduce((sum, tx) => sum + tx.total, 0);
  const todayWeight = transactions.reduce((sum, tx) => sum + tx.weight, 0);
  const hourlyData = useMemo(() => {
    const now = new Date();
    const hours = Array.from({ length: 7 }, (_, i) => subHours(now, 6 - i));
    return hours.map(hour => {
        const hourStart = new Date(hour).setMinutes(0, 0, 0);
        const hourEnd = new Date(hourStart).setMinutes(59, 59, 999);
        const hourlyWeight = transactions
            .filter(tx => tx.timestamp >= hourStart && tx.timestamp <= hourEnd)
            .reduce((sum, tx) => sum + tx.weight, 0);
        return { name: `${new Date(hourStart).getHours()}:00`, kg: hourlyWeight };
    });
  }, [transactions]);
  const liveThroughput = hourlyData.length > 0 ? hourlyData[hourlyData.length - 1].kg : 0;
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold font-display uppercase text-off-white">Manager Dashboard // God View</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Today's Cash In" value={`R ${todayTotal.toFixed(2)}`} icon={DollarSign} change={`${transactions.length} transactions`} changeType="increase" />
              <StatCard title="Today's Weight" value={`${todayWeight.toFixed(2)} kg`} icon={Weight} change="Live from weighbridge" changeType="increase" />
              <StatCard title="Live Throughput" value={`${liveThroughput} kg/hr`} icon={BarChart} change="Last hour" changeType="increase" />
              <StatCard title="Active Fraud Alerts" value="3" icon={AlertTriangle} change="1 new alert" changeType="decrease" />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm">Sync Status</CardTitle>
                        {isOnline ? <Wifi className="w-5 h-5 text-neon-green"/> : <WifiOff className="w-5 h-5 text-safety-red"/>}
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Badge variant={isOnline ? 'default' : 'destructive'} className={isOnline ? 'bg-neon-green text-industrial-black' : ''}>{isOnline ? (isSyncing ? 'Syncing...' : 'Online') : 'Offline'}</Badge>
                            <Button variant="industrial" size="sm" onClick={syncNow} disabled={isSyncing || !isOnline}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                Sync Now
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Last sync: {lastSync || 'Never'}</p>
                    </CardContent>
                </Card>
              </motion.div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>AI Yield Analytics (Last 7 Hours)</CardTitle></CardHeader>
                  <CardContent className="h-[350px] p-0">
                      <ResponsiveContainer width="100%" height="100%"><AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}><defs><linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00FF41" stopOpacity={0.8}/><stop offset="95%" stopColor="#00FF41" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(229, 229, 229, 0.2)" /><XAxis dataKey="name" stroke="#E5E5E5" /><YAxis stroke="#E5E5E5" /><Tooltip contentStyle={{ backgroundColor: '#050505', border: '2px solid #333' }} /><Area type="monotone" dataKey="kg" stroke="#00FF41" fillOpacity={1} fill="url(#colorKg)" /></AreaChart></ResponsiveContainer>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Fraud Alert Panel</CardTitle></CardHeader>
                  <CardContent><div className="space-y-4">{mockFraudAlerts.map(alert => (<div key={alert.id} className="flex items-start space-x-3"><AlertTriangle className={`w-5 h-5 mt-1 ${alert.level === 'high' ? 'text-safety-red' : alert.level === 'medium' ? 'text-yellow-400' : 'text-neon-green'}`} /><div><p className="text-sm font-medium text-off-white">{alert.message}</p><p className="text-xs text-muted-foreground">{alert.time}</p></div></div>))}</div></CardContent>
              </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Recent System Activity (Audit Log)</CardTitle></CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px]">
                    <Table>
                        <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                        <TableBody>{audits.map(log => (<TableRow key={log.id}><TableCell className="font-mono">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell><TableCell>{log.userId}</TableCell><TableCell className="font-mono">{log.action}</TableCell></TableRow>))}</TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}