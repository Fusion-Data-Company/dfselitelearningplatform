import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { 
  Brain, 
  Heart,
  Shield,
  Send, 
  MessageCircle,
  Sparkles,
  Target,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  CheckCircle
} from "lucide-react";

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

interface Message {
  role: 'user' | 'agent';
  content: string;
  citations?: any[];
  timestamp: Date;
}

const agents = [
  {
    id: "coachbot",
    name: "CoachBot",
    icon: Brain,
    description: "Your personal exam coach providing targeted feedback and remediation",
    specialty: "Exam Preparation",
    features: ["Question Analysis", "Weak Topic Identification", "Study Recommendations", "Performance Insights"],
    color: "from-primary to-primary/80",
    accentColor: "border-primary/40 text-primary",
    bgColor: "bg-primary/10"
  },
  {
    id: "studybuddy",
    name: "StudyBuddy", 
    icon: Heart,
    description: "Your motivational study companion creating personalized learning plans",
    specialty: "Study Planning",
    features: ["7-Day Study Plans", "iFlash Generation", "Progress Tracking", "Motivation Boost"],
    color: "from-secondary to-secondary/80",
    accentColor: "border-secondary/40 text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    id: "proctorbot",
    name: "ProctorBot",
    icon: Shield,
    description: "Exam proctoring and integrity monitoring for authentic test experience",
    specialty: "Exam Proctoring", 
    features: ["Pre-Exam Checklist", "Integrity Monitoring", "Post-Exam Analysis", "Policy Guidance"],
    color: "from-accent to-accent/80",
    accentColor: "border-accent/40 text-accent",
    bgColor: "bg-accent/10"
  }
];

export default function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async ({ agentId, message }: { agentId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/chat`, {
        message,
        viewId: `agents:guest:${Date.now()}`
      });
      return response.json() as Promise<AgentResponse>;
    },
    onSuccess: (data, variables) => {
      setMessages(prev => ({
        ...prev,
        [variables.agentId]: [
          ...(prev[variables.agentId] || []),
          { 
            role: 'agent', 
            content: data.message,
            citations: data.citations,
            timestamp: new Date()
          }
        ]
      }));
    },
    onError: (error) => {
      toast({
        title: "AI Agent Error",
        description: error instanceof Error ? error.message : "Failed to get response from agent",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeAgent) return;
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message to chat
    setMessages(prev => ({
      ...prev,
      [activeAgent]: [
        ...(prev[activeAgent] || []),
        { role: 'user', content: userMessage, timestamp: new Date() }
      ]
    }));
    
    // Send to agent
    chatMutation.mutate({ agentId: activeAgent, message: userMessage });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentAgent = agents.find(agent => agent.id === activeAgent);
  const currentMessages = activeAgent ? messages[activeAgent] || [] : [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Carbon Fiber Hexagon Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: `url(/agents-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <Navigation />
      <Sidebar />
      
      <main className="ml-96 pt-16 min-h-screen relative z-10">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="glassmorphism-card rounded-2xl p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-elite-glow">
                  <Sparkles className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h1 className="cinzel text-4xl font-bold text-shimmer mb-2">
                    AI Learning Agents
                  </h1>
                  <p className="text-lg text-muted-foreground geist">
                    Three specialized AI tutors designed to accelerate your DFS-215 certification journey
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>Personalized Coaching</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-secondary" />
                  <span>Adaptive Learning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-accent" />
                  <span>Exam Readiness</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Agent Selection */}
              <div className="space-y-6">
                <h2 className="cinzel text-2xl font-bold text-shimmer mb-4">Choose Your AI Tutor</h2>
                
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  const isActive = activeAgent === agent.id;
                  
                  return (
                    <Card
                      key={agent.id}
                      className={`education-card cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                        isActive 
                          ? 'border-primary/60 ring-2 ring-primary/30 scale-105' 
                          : 'border-border/20 hover:border-primary/40'
                      }`}
                      onClick={() => setActiveAgent(agent.id)}
                    >
                      <CardContent className="p-6 relative z-10">
                        <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 ${isActive ? 'opacity-10' : 'group-hover:opacity-5'} transition-opacity duration-300`}></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-foreground">{agent.name}</h3>
                              <Badge variant="outline" className={`text-xs ${agent.accentColor}`}>
                                {agent.specialty}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground text-sm mb-4 leading-relaxed geist">
                            {agent.description}
                          </p>
                          
                          <div className="space-y-2">
                            {agent.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <CheckCircle className="w-3 h-3 text-primary" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          
                          {isActive && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <div className="flex items-center space-x-2 text-xs text-primary">
                                <MessageCircle className="w-3 h-3" />
                                <span className="font-medium">Active • Ready to help</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-2">
                {activeAgent ? (
                  <div className="space-y-6">
                    {/* Chat Header */}
                    <Card className="education-card border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentAgent?.color} flex items-center justify-center`}>
                            {currentAgent && <currentAgent.icon className="w-6 h-6 text-white" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-foreground">{currentAgent?.name}</h3>
                            <p className="text-muted-foreground text-sm">{currentAgent?.description}</p>
                          </div>
                          <div className="ml-auto">
                            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                              Online
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Messages */}
                    <Card className="education-card border-primary/20">
                      <CardContent className="p-0">
                        <ScrollArea className="h-96 p-6">
                          {currentMessages.length === 0 ? (
                            <div className="text-center py-12">
                              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentAgent?.color} flex items-center justify-center mx-auto mb-4`}>
                                {currentAgent && <currentAgent.icon className="w-8 h-8 text-white" />}
                              </div>
                              <h4 className="font-bold text-lg mb-2">Start a conversation with {currentAgent?.name}</h4>
                              <p className="text-muted-foreground text-sm mb-6">
                                Ask questions about your studies, get personalized recommendations, or seek help with specific topics.
                              </p>
                              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                                {[
                                  "What should I focus on for exam prep?",
                                  "Create a study plan for this week",
                                  "Explain HMO balance billing rules"
                                ].map((suggestion, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    className="text-left justify-start border-border/50 hover:border-primary/50 text-sm"
                                    onClick={() => setInputValue(suggestion)}
                                  >
                                    💡 {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {currentMessages.map((message, index) => (
                                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-sm p-4 rounded-2xl ${
                                    message.role === 'user' 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'glassmorphism-card border border-border/50'
                                  }`}>
                                    <div className="geist text-sm leading-relaxed">
                                      {message.content}
                                    </div>
                                    {message.citations && message.citations.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-border/30">
                                        <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                                        {message.citations.map((citation, citIndex) => (
                                          <Badge key={citIndex} variant="outline" className="text-xs mr-2 mb-1">
                                            {citation.lesson}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {message.timestamp.toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {chatMutation.isPending && (
                                <div className="flex justify-start">
                                  <div className="glassmorphism-card border border-border/50 p-4 rounded-2xl max-w-sm">
                                    <div className="flex items-center space-x-2">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                      </div>
                                      <span className="text-xs text-muted-foreground">Thinking...</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Input */}
                    <Card className="education-card border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-end space-x-3">
                          <div className="flex-1">
                            <Textarea
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder={`Ask ${currentAgent?.name} anything about DFS-215...`}
                              className="min-h-[80px] resize-none border-border/50 focus:border-primary/50"
                              disabled={chatMutation.isPending}
                            />
                          </div>
                          <Button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || chatMutation.isPending}
                            className="floating-action px-6 py-3 h-auto"
                          >
                            <Send className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="education-card border-border/20">
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-6">
                        <Brain className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="cinzel text-2xl font-bold mb-4">Select an AI Tutor</h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Choose one of our specialized AI learning agents to get personalized help with your DFS-215 certification studies.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}