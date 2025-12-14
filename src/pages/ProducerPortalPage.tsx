import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';
export function ProducerPortalPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-display uppercase text-off-white">Corporate Producer Portal</h1>
            <Button variant="industrial">
              <Download className="w-4 h-4 mr-2" />
              Download Compliance Certificate
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Waste Diversion Metrics (Mock Data)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-mono font-bold text-neon-green">8,241 kg</p>
              <p className="text-muted-foreground">Total materials recycled this quarter.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}