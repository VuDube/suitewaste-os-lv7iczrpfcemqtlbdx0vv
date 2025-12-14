import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send } from 'lucide-react';
import { chatService, formatTime, renderToolCall } from '@/lib/chat';
import type { Message } from '../../worker/types';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
interface ChatHubProps {
  initPrompt?: string;
}
export function ChatHub({ initPrompt }: ChatHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const handleSend = useCallback(async (messageToSend?: string) => {
    const message = (messageToSend || input).trim();
    if (!message) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    if (!messageToSend) {
      setInput('');
    }
    setIsProcessing(true);
    let streamingMessage = '';
    const assistantMessageId = crypto.randomUUID();
    await chatService.sendMessage(message, undefined, (chunk) => {
      streamingMessage += chunk;
      setMessages(prev => {
        const existing = prev.find(m => m.id === assistantMessageId);
        if (existing) {
          return prev.map(m => m.id === assistantMessageId ? { ...m, content: streamingMessage } : m);
        } else {
          return [...prev, { id: assistantMessageId, role: 'assistant', content: streamingMessage, timestamp: Date.now() }];
        }
      });
    });
    const finalState = await chatService.getMessages();
    if (finalState.success && finalState.data) {
      setMessages(finalState.data.messages);
    }
    setIsProcessing(false);
  }, [input]);
  const fetchMessages = async () => {
    const response = await chatService.getMessages();
    if (response.success && response.data) {
      setMessages(response.data.messages);
    }
  };
  useEffect(() => {
    if (isOpen) {
      chatService.newSession();
      if (initPrompt) {
        handleSend(initPrompt);
      }
      fetchMessages();
    }
  }, [isOpen, initPrompt, handleSend]);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="industrial">
          <MessageCircle className="w-4 h-4 mr-2" />
          AI Assistant
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-industrial-black border-l-2 border-border flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-neon-green font-display">AI Assistant / Comms</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-sm p-3 rounded-none border-2', msg.role === 'user' ? 'bg-gray-800' : 'bg-gray-900')}>
                    <p className="text-sm text-off-white whitespace-pre-wrap">{msg.content}</p>
                    {msg.toolCalls && (
                      <div className="mt-2 space-y-1 border-t-2 border-border pt-2">
                        {msg.toolCalls.map(tc => <Badge key={tc.id} variant="secondary">{renderToolCall(tc)}</Badge>)}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-right mt-1 font-mono">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="p-4 border-t-2 border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask for help or send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleSend()}
              disabled={isProcessing}
            />
            <Button variant="industrial" onClick={() => handleSend()} disabled={isProcessing}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}