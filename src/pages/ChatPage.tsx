import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatHub } from '@/components/ChatHub';
import { motion } from 'framer-motion';
export function ChatPage() {
  // In a real app, you'd request notification permissions here.
  // useEffect(() => {
  //   if ('Notification' in window && Notification.permission !== 'granted') {
  //     Notification.requestPermission();
  //   }
  // }, []);
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold font-display uppercase text-off-white">Communications Hub</h1>
          <Card>
            <CardHeader>
              <CardTitle>Team Chat & AI Assistance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This is a centralized hub for team communication and AI-powered assistance.
                Select a channel or open the AI assistant.
              </p>
              <ChatHub />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}