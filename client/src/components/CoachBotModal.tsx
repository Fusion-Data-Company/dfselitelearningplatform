import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Brain, Send, X, Book } from "lucide-react";

interface CoachBotModalProps {
  open: boolean;
  onClose: () => void;
  viewId?: string;
}

interface AgentResponse {
  role: string;
  message: string;
  steps?: string[];
  citations?: Array<{
    chunkId: string;
    lesson: string;
    heading?: string;
  }>;
  actions?: Array<{
    type: string;
    [key: string]: any;
  }>;
}

export default function CoachBotModal({ open, onClose, viewId }: CoachBotModalProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; citations?: any[] }>>([]);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async ({ message, viewId }: { message: string; viewId: string }) => {
      const response = await apiRequest("POST", "/api/agents/coachbot/chat", {
        message,
        viewId
      });
      return response.json() as Promise<AgentResponse>;
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { 
          role: 'agent', 
          content: data.message,
          citations: data.citations 
        }
      ]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from CoachBot",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage("");
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    chatMutation.mutate({ 
      message: userMessage, 
      viewId: viewId || `dashboard:${Date.now()}:` 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="ai-agent-panel max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="cinzel text-lg font-bold">CoachBot</h3>
              <p className="text-sm text-muted-foreground font-normal">Your AI teaching assistant</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto"
              data-testid="button-close-coachbot"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto" data-testid="coachbot-messages">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything about the course material!</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex space-x-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'agent' && (
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`flex-1 ${msg.role === 'user' ? 'max-w-xs' : ''}`}>
                <div className={`p-4 rounded-xl ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-card'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.citations.map((citation, idx) => (
                        <Badge 
                          key={idx}
                          variant="secondary"
                          className="bg-primary/10 text-primary text-xs"
                          data-testid="coachbot-citation"
                        >
                          <Book className="w-3 h-3 mr-1" />
                          {citation.lesson}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {chatMutation.isPending && (
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-card p-4 rounded-xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex space-x-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about balance billing, HMO networks, or any lesson topic..."
            className="flex-1 bg-input border-border"
            disabled={chatMutation.isPending}
            data-testid="input-coachbot-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || chatMutation.isPending}
            className="px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
