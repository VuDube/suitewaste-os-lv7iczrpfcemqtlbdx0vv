import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
const mockFleetData = [
  { id: 'TRUCK-01', x: 10, y: 20, status: 'On Route' },
  { id: 'TRUCK-02', x: 45, y: 60, status: 'Idle' },
  { id: 'TRUCK-03', x: 80, y: 35, status: 'Collecting' },
];
const mockMaintenanceLog = [
    { id: 1, truckId: 'TRUCK-01', service: 'Oil Change', date: '2024-07-15', cost: 1200 },
    { id: 2, truckId: 'TRUCK-02', service: 'Tire Rotation', date: '2024-07-10', cost: 800 },
    { id: 3, truckId: 'TRUCK-01', service: 'Brake Inspection', date: '2024-06-28', cost: 1500 },
];
const initialDriverTasks = [
    { id: 1, type: 'Collection', address: '123 Main St, Rustenburg', status: 'Pending' },
    { id: 2, type: 'Delivery', address: '456 Industrial Rd, Mogwase', status: 'In Progress' },
    { id: 3, type: 'Collection', address: '789 Platinum Blvd, Phokeng', status: 'Pending' },
];
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
const SwipeableTaskItem = ({ task, onComplete }: { task: typeof initialDriverTasks[0], onComplete: (id: number) => void }) => {
  const handlers = useSwipeable({
    onSwipedRight: () => onComplete(task.id),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });
  return (
    <div {...handlers} className="p-4 border-b-2 border-border touch-pan-y">
      <p className="font-bold">{task.type} - <span className="font-mono">{task.status}</span></p>
      <p className="text-sm text-muted-foreground">{task.address}</p>
      <div className="text-xs text-center text-neon-green/50 mt-2">SWIPE RIGHT TO COMPLETE</div>
    </div>
  );
};
export function LogisticsPage() {
  const isMobile = useIsMobile();
  const [driverTasks, setDriverTasks] = useState(initialDriverTasks);
  const completeTask = (taskId: number) => {
    setDriverTasks(tasks => tasks.filter(t => t.id !== taskId));
    const completedTask = driverTasks.find(t => t.id === taskId);
    if (completedTask) {
      toast.success('Task Completed', {
        description: `${completedTask.type} at ${completedTask.address}`,
        icon: <CheckCircle className="w-5 h-5" />,
      });
    }
  };
  const DriverTaskList = () => (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card>
        <CardHeader><CardTitle>Driver Task List</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            <div className="space-y-0">
              {driverTasks.map(task => (
                <SwipeableTaskItem key={task.id} task={task} onComplete={completeTask} />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Address</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {driverTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.type}</TableCell>
                    <TableCell>{task.address}</TableCell>
                    <TableCell><Badge variant={task.status === 'In Progress' ? 'default' : 'secondary'} className={task.status === 'In Progress' ? 'bg-neon-green text-industrial-black' : ''}>{task.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
  return (
    <AppLayout>
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="text-3xl font-bold font-display uppercase text-off-white">Fleet & Logistics</motion.h1>
          <div className="grid gap-4 lg:grid-cols-3">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Live Fleet Map (Mock GPS)</CardTitle></CardHeader>
                <CardContent className="h-[450px] bg-gray-900 border-2 border-border">
                  <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(229, 229, 229, 0.2)" /><XAxis type="number" dataKey="x" name="Longitude" unit="°" domain={[0, 100]} stroke="#E5E5E5" /><YAxis type="number" dataKey="y" name="Latitude" unit="°" domain={[0, 100]} stroke="#E5E5E5" /><Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#050505', border: '2px solid #333' }}/><Scatter name="Trucks" data={mockFleetData} fill="#00FF41" /></ScatterChart></ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Fleet Status</CardTitle></CardHeader>
                <CardContent><ul className="space-y-2">{mockFleetData.map(truck => (<li key={truck.id} className="flex justify-between items-center"><span className="font-mono">{truck.id}</span><Badge variant={truck.status === 'On Route' ? 'default' : 'secondary'} className={truck.status === 'On Route' ? 'bg-neon-green text-industrial-black' : ''}>{truck.status}</Badge></li>))}</ul></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Service Reminders</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">TRUCK-02: Service due in 15 days.</p></CardContent>
              </Card>
            </motion.div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DriverTaskList />
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card>
                <CardHeader><CardTitle>Maintenance Log</CardTitle></CardHeader>
                <CardContent><Table><TableHeader><TableRow><TableHead>Truck ID</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Cost</TableHead></TableRow></TableHeader><TableBody>{mockMaintenanceLog.map(log => (<TableRow key={log.id}><TableCell className="font-mono">{log.truckId}</TableCell><TableCell>{log.service}</TableCell><TableCell>{log.date}</TableCell><TableCell className="text-right font-mono">R {log.cost.toFixed(2)}</TableCell></TableRow>))}</TableBody></Table></CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}