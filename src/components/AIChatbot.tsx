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

const SUGGESTED_QUESTIONS = [
  { label: '🏅 Badges', message: 'How do badges work in GreenScore?' },
  { label: '📊 Score', message: 'How is the Green Score calculated?' },
  { label: '🌱 Eco tips', message: 'What eco-friendly practices can shops adopt?' },
  { label: '🏪 Verification', message: 'How does shop verification work?' },
];

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

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
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
        if (response.status === 429) throw new Error('Rate limited. Please try again later.');
        if (response.status === 402) throw new Error('Service temporarily unavailable.');
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
        { role: 'assistant', content: error.message || 'Sorry, something went wrong.' }
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl eco-gradient glow-eco z-50 animate-glow-pulse"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] h-[480px] sm:h-[520px] flex flex-col shadow-2xl z-50 overflow-hidden glass-card" style={{ border: '1px solid hsla(142, 71%, 45%, 0.15)' }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid hsla(142, 71%, 45%, 0.1)', background: 'hsla(142, 71%, 45%, 0.05)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl eco-gradient glow-eco">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground font-vardant text-sm tracking-wider">VARDANT AI</h3>
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
          <div className="text-center py-6">
            <Bot className="h-12 w-12 text-primary/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Ask me anything about VARDANT:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((sq) => (
                <button
                  key={sq.label}
                  onClick={() => sendMessage(sq.message)}
                  className="text-xs px-3 py-2 rounded-full border border-border bg-secondary/50 hover:bg-primary/10 hover:border-primary/30 transition-colors text-foreground"
                >
                  {sq.label}
                </button>
              ))}
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 eco-gradient">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'eco-gradient text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-foreground rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full eco-gradient flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center eco-gradient">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Suggested follow-ups */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {SUGGESTED_QUESTIONS.slice(0, 2).map((sq) => (
            <button
              key={sq.label}
              onClick={() => sendMessage(sq.message)}
              className="text-[10px] px-2 py-1 rounded-full border border-border bg-secondary/50 hover:bg-primary/10 transition-colors text-muted-foreground whitespace-nowrap flex-shrink-0"
            >
              {sq.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4" style={{ borderTop: '1px solid hsla(142, 71%, 45%, 0.1)' }}>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about eco-practices..."
            disabled={isLoading}
            className="flex-1 bg-secondary/50 border-border"
          />
          <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon" className="eco-gradient">
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
