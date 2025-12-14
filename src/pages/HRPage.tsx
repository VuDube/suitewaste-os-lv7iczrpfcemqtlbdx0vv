import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Staff, getDb } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, Loader2 } from 'lucide-react';
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
export function HRPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const fetchStaff = async () => {
    setIsFetching(true);
    const db = await getDb();
    const staffData = await db.staff.find().sort({ name: 'asc' }).exec() as Staff[];
    setStaff(staffData);
    setIsFetching(false);
  };
  useEffect(() => {
    fetchStaff();
  }, []);
  const handleClockInOut = async (employee: Staff) => {
    try {
      const db = await getDb();
      const doc = await db.staff.findOne({ selector: { id: employee.id } }).exec();
      if (doc) {
        const isClockingIn = !employee.clockedIn;
        const updates: Partial<Staff> = {
          clockedIn: isClockingIn,
          shiftStart: isClockingIn ? Date.now() : null,
        };
        await doc.patch(updates);
        toast.success(`${employee.name} has been clocked ${isClockingIn ? 'in' : 'out'}.`);
        await fetchStaff(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update staff status:', error);
      toast.error('Operation Failed', { description: 'Could not update staff member status.' });
    }
  };
  return (
    <AppLayout>
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1 variants={itemVariants} className="text-3xl font-bold font-display uppercase text-off-white">HR & Staff Module</motion.h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div variants={itemVariants}><Card><CardHeader><CardTitle>Staff Roster & Time Clock</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Shift</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{isFetching ? (<TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>) : staff.map(employee => (<TableRow key={employee.id}><TableCell className="font-medium">{employee.name}</TableCell><TableCell>{employee.role}</TableCell><TableCell><Badge variant={employee.clockedIn ? 'default' : 'secondary'} className={employee.clockedIn ? 'bg-neon-green text-industrial-black' : ''}>{employee.clockedIn ? 'Clocked In' : 'Clocked Out'}</Badge></TableCell><TableCell>{employee.clockedIn && employee.shiftStart ? `${formatDistanceToNow(new Date(employee.shiftStart))}` : 'N/A'}</TableCell><TableCell className="text-right"><Button variant={employee.clockedIn ? 'destructive' : 'industrial'} size="sm" onClick={() => handleClockInOut(employee)}>{employee.clockedIn ? 'Clock Out' : 'Clock In'}</Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></motion.div>
            <motion.div variants={itemVariants}><Card><CardHeader><CardTitle>E-Learning & Training</CardTitle></CardHeader><CardContent><Accordion type="single" collapsible className="w-full"><AccordionItem value="item-1"><AccordionTrigger>Safety Training 101</AccordionTrigger><AccordionContent><p className="mb-4">Basic safety protocols for the weighbridge and processing areas. This content is available offline.</p><Button variant="outline"><Download className="w-4 h-4 mr-2" /> Download PDF</Button></AccordionContent></AccordionItem><AccordionItem value="item-2"><AccordionTrigger>Material Grading Standards</AccordionTrigger><AccordionContent><p className="mb-4">Advanced guide to identifying and grading non-ferrous metals according to industry standards.</p><Button variant="outline"><Download className="w-4 h-4 mr-2" /> Download PDF</Button></AccordionContent></AccordionItem><AccordionItem value="item-3"><AccordionTrigger>POPIA Compliance</AccordionTrigger><AccordionContent><p className="mb-4">Understanding the Protection of Personal Information Act and its application at the buyback center.</p><Button variant="outline"><Download className="w-4 h-4 mr-2" /> Download PDF</Button></AccordionContent></AccordionItem></Accordion></CardContent></Card></motion.div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}