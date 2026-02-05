 import { useState, useRef, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card } from '@/components/ui/card';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { MessageCircle, X, Send, Bot, User, Loader2, Leaf } from 'lucide-react';
 import ReactMarkdown from 'react-markdown';
 import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
 
 interface Message {
   role: 'user' | 'assistant';
   content: string;
 }
 
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/greenscore-chat`;
 
 export function AIChatbot() {
   const [isOpen, setIsOpen] = useState(false);
   const [messages, setMessages] = useState<Message[]>([]);
   const [input, setInput] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const { profile } = useFirebaseAuth();
 
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages]);
 
   const sendMessage = async () => {
     if (!input.trim() || isLoading) return;
 
     const userMsg: Message = { role: 'user', content: input.trim() };
     setMessages(prev => [...prev, userMsg]);
     setInput('');
     setIsLoading(true);
 
     let assistantContent = '';
 
     try {
       const response = await fetch(CHAT_URL, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({
           messages: [...messages, userMsg],
           userRole: profile?.role || 'customer',
         }),
       });
 
       if (!response.ok) {
         if (response.status === 429) {
           throw new Error('Rate limited. Please try again later.');
         }
         if (response.status === 402) {
           throw new Error('Service temporarily unavailable.');
         }
         throw new Error('Failed to get response');
       }
 
       const reader = response.body?.getReader();
       if (!reader) throw new Error('No reader');
 
       const decoder = new TextDecoder();
       let textBuffer = '';
 
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
 
         textBuffer += decoder.decode(value, { stream: true });
 
         let newlineIndex: number;
         while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
           let line = textBuffer.slice(0, newlineIndex);
           textBuffer = textBuffer.slice(newlineIndex + 1);
 
           if (line.endsWith('\r')) line = line.slice(0, -1);
           if (line.startsWith(':') || line.trim() === '') continue;
           if (!line.startsWith('data: ')) continue;
 
           const jsonStr = line.slice(6).trim();
           if (jsonStr === '[DONE]') break;
 
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content;
             if (content) {
               assistantContent += content;
               setMessages(prev => {
                 const last = prev[prev.length - 1];
                 if (last?.role === 'assistant') {
                   return prev.map((m, i) => 
                     i === prev.length - 1 ? { ...m, content: assistantContent } : m
                   );
                 }
                 return [...prev, { role: 'assistant', content: assistantContent }];
               });
             }
           } catch {
             textBuffer = line + '\n' + textBuffer;
             break;
           }
         }
       }
     } catch (error: any) {
       setMessages(prev => [
         ...prev,
         { role: 'assistant', content: error.message || 'Sorry, something went wrong. Please try again.' }
       ]);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       sendMessage();
     }
   };
 
   if (!isOpen) {
     return (
       <Button
         onClick={() => setIsOpen(true)}
         className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 z-50"
         size="icon"
       >
         <MessageCircle className="h-6 w-6" />
       </Button>
     );
   }
 
   return (
     <Card className="fixed bottom-6 right-6 w-[380px] h-[520px] flex flex-col shadow-2xl border-border/50 z-50 overflow-hidden">
       {/* Header */}
       <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/20">
               <Leaf className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h3 className="font-semibold text-foreground">GreenScore AI</h3>
               <p className="text-xs text-muted-foreground">Your eco assistant</p>
             </div>
           </div>
           <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Messages */}
       <ScrollArea className="flex-1 p-4" ref={scrollRef}>
         {messages.length === 0 ? (
           <div className="text-center py-8">
             <Bot className="h-12 w-12 text-primary/50 mx-auto mb-3" />
             <p className="text-sm text-muted-foreground mb-4">
               Hi! I'm your GreenScore assistant. Ask me anything about:
             </p>
             <div className="space-y-2 text-xs text-muted-foreground">
               <p>🌱 Eco-friendly practices</p>
               <p>🏪 Shop verification process</p>
               <p>🏅 Badge requirements</p>
               <p>📊 Green Score calculation</p>
             </div>
           </div>
         ) : (
           <div className="space-y-4">
             {messages.map((msg, idx) => (
               <div
                 key={idx}
                 className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
               >
                 {msg.role === 'assistant' && (
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                     <Bot className="h-4 w-4 text-primary" />
                   </div>
                 )}
                 <div
                   className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                     msg.role === 'user'
                       ? 'bg-primary text-primary-foreground rounded-br-md'
                       : 'bg-muted text-foreground rounded-bl-md'
                   }`}
                 >
                   {msg.role === 'assistant' ? (
                     <div className="prose prose-sm dark:prose-invert max-w-none">
                       <ReactMarkdown>{msg.content}</ReactMarkdown>
                     </div>
                   ) : (
                     msg.content
                   )}
                 </div>
                 {msg.role === 'user' && (
                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                     <User className="h-4 w-4 text-primary-foreground" />
                   </div>
                 )}
               </div>
             ))}
             {isLoading && messages[messages.length - 1]?.role === 'user' && (
               <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                   <Bot className="h-4 w-4 text-primary" />
                 </div>
                 <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                   <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                 </div>
               </div>
             )}
           </div>
         )}
       </ScrollArea>
 
       {/* Input */}
       <div className="p-4 border-t border-border/50">
         <div className="flex gap-2">
           <Input
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyPress={handleKeyPress}
             placeholder="Ask about eco-practices..."
             disabled={isLoading}
             className="flex-1"
           />
           <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
             {isLoading ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <Send className="h-4 w-4" />
             )}
           </Button>
         </div>
       </div>
     </Card>
   );
 }