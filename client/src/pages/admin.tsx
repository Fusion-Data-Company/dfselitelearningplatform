import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  BookOpen, 
  Bot, 
  HelpCircle, 
  BarChart3, 
  Tag, 
  Settings,
  Plus,
  Edit,
  GripVertical,
  Upload,
  Rocket,
  Eye,
  Undo,
  Play,
  Save,
  RotateCcw,
  TrendingUp,
  Users,
  FileText,
  Database
} from "lucide-react";

interface AgentProfile {
  id: string;
  displayName: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  guardrails: {
    requireCitations: boolean;
    denyDuringExam: boolean;
    tone: string;
  };
}

interface CourseStructure {
  tracks: Array<{
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    ceHours: number;
    isActive: boolean;
    modules: Array<{
      id: string;
      title: string;
      description: string;
      orderIndex: number;
      lessons: Array<{
        id: string;
        title: string;
        slug: string;
        duration: number;
        ceHours: number;
      }>;
    }>;
  }>;
}

interface QuestionBank {
  id: string;
  title: string;
  description: string;
  topics: string[];
  blueprint: any;
  timeLimitSec: number;
}

export default function AdminPage() {
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = tab || "content";
  const [selectedAgent, setSelectedAgent] = useState("coachbot");
  const [testResult, setTestResult] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check admin access
  const isAdmin = user?.role === 'admin';

  const { data: agentProfiles, isLoading: agentsLoading } = useQuery<AgentProfile[]>({
    queryKey: ['/api/admin/agents'],
    enabled: isAdmin,
  });

  const { data: courseStructure, isLoading: courseLoading } = useQuery<CourseStructure>({
    queryKey: ['/api/courses'],
    enabled: isAdmin,
  });

  const { data: questionBanks, isLoading: banksLoading } = useQuery<QuestionBank[]>({
    queryKey: ['/api/question-banks'],
    enabled: isAdmin,
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ agentId, data }: { agentId: string; data: any }) => {
      await apiRequest("POST", `/api/admin/agents/${agentId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
      toast({
        title: "Agent Updated",
        description: "Agent configuration has been saved successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agent",
        variant: "destructive",
      });
    },
  });

  const testAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/chat`, {
        message: "Why is balance billing restricted under HMOs?",
        viewId: "admin:test:hmo-balance-billing"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResult(JSON.stringify(data, null, 2));
      toast({
        title: "Test Successful",
        description: "Agent responded with citations and proper formatting.",
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Agent test failed",
        variant: "destructive",
      });
    },
  });

  const handleAgentUpdate = (agentId: string, updates: any) => {
    updateAgentMutation.mutate({ agentId, data: updates });
  };

  const handleTestAgent = (agentId: string) => {
    testAgentMutation.mutate(agentId);
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-4xl mx-auto text-center">
              <Tag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="cinzel text-3xl font-bold mb-4">Admin Access Required</h1>
              <p className="text-muted-foreground">You need admin privileges to access this section.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentAgent = agentProfiles?.find(agent => agent.id === selectedAgent);

  return (
    <div className="min-h-screen education-bg">
      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="cinzel text-3xl font-bold text-foreground mb-2">Admin Panel</h2>
              <p className="text-muted-foreground">Manage content, agents, and student progress</p>
            </div>

            <Tabs value={activeTab} className="space-y-8">
              <Card className="glassmorphism border-border">
                <CardContent className="p-4">
                  <TabsList className="grid grid-cols-6 w-full bg-transparent">
                    <TabsTrigger 
                      value="content" 
                      className="data-[state=active]:section-active"
                      data-testid="tab-content"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Content Map
                    </TabsTrigger>
                    <TabsTrigger 
                      value="users" 
                      className="data-[state=active]:section-active"
                      data-testid="tab-users"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      User Management
                    </TabsTrigger>
                    <TabsTrigger 
                      value="agents" 
                      className="data-[state=active]:section-active"
                      data-testid="tab-agents"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      AI Agents
                    </TabsTrigger>
                    <TabsTrigger 
                      value="banks" 
                      className="data-[state=active]:section-active"
                      data-testid="tab-banks"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Question Banks
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="data-[state=active]:section-active"
                      data-testid="tab-analytics"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ce" 
                      className="data-[state=active]:section-active"
                      data-testid="tab-ce"
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      CE Management
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>

              {/* Content Map Tab */}
              <TabsContent value="content">
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="education-card border-primary/20">
                      <CardContent className="p-4 text-center">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold text-primary">24</p>
                        <p className="text-sm text-muted-foreground">Total Lessons</p>
                      </CardContent>
                    </Card>
                    <Card className="education-card border-secondary/20">
                      <CardContent className="p-4 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-secondary" />
                        <p className="text-2xl font-bold text-secondary">3.2K</p>
                        <p className="text-sm text-muted-foreground">Content Chunks</p>
                      </CardContent>
                    </Card>
                    <Card className="education-card border-accent/20">
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-accent" />
                        <p className="text-2xl font-bold text-accent">94%</p>
                        <p className="text-sm text-muted-foreground">Content Health</p>
                      </CardContent>
                    </Card>
                    <Card className="education-card border-chart-2/20">
                      <CardContent className="p-4 text-center">
                        <Database className="w-8 h-8 mx-auto mb-2 text-chart-2" />
                        <p className="text-2xl font-bold text-chart-2">45 GB</p>
                        <p className="text-sm text-muted-foreground">Storage Used</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="cinzel text-xl font-bold">Course Structure</h3>
                          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Track
                          </Button>
                        </div>

                        {courseLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-20 bg-muted rounded-xl"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4" data-testid="course-structure">
                            {courseStructure?.tracks.map((track) => (
                              <Card key={track.id} className="border border-border">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <Settings className="w-4 h-4 text-muted-foreground" />
                                      <h4 className="font-semibold">{track.title}</h4>
                                      {track.ceHours > 0 && (
                                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                                          {track.ceHours}-Hr CE
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button variant="ghost" size="sm">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <GripVertical className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="ml-6 space-y-2">
                                    {track.modules.map((module) => (
                                      <div key={module.id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <BookOpen className="w-4 h-4 text-secondary" />
                                          <span className="text-sm">{module.title}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {module.lessons.length} lessons
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <h3 className="cinzel font-bold mb-4">Upload Content</h3>
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Drop DOCX files here or click to browse
                          </p>
                          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Select Files
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <h3 className="cinzel font-bold mb-4">Content Statistics</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Tracks</span>
                            <span className="font-semibold">{courseStructure?.tracks.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Modules</span>
                            <span className="font-semibold">
                              {courseStructure?.tracks.reduce((acc, track) => acc + track.modules.length, 0) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Lessons</span>
                            <span className="font-semibold">
                              {courseStructure?.tracks.reduce((acc, track) => 
                                acc + track.modules.reduce((moduleAcc, module) => moduleAcc + module.lessons.length, 0), 0
                              ) || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Content Chunks</span>
                            <span className="font-semibold">2,847</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <h3 className="cinzel font-bold mb-4">Publish Content</h3>
                        <div className="space-y-3">
                          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                            <Rocket className="w-4 h-4 mr-2" />
                            Publish Draft
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Changes
                          </Button>
                          <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/10">
                            <Undo className="w-4 h-4 mr-2" />
                            Revert to Published
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users">
                <div className="space-y-6">
                  {/* User Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="education-card border-primary/20">
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold text-primary">1,247</p>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                      </CardContent>
                    </Card>
                    <Card className="education-card border-secondary/20">
                      <CardContent className="p-4 text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-secondary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-2xl font-bold text-secondary">324</p>
                        <p className="text-sm text-muted-foreground">Active Now</p>
                      </CardContent>
                    </Card>
                    <Card className="education-card border-accent/20">
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-accent" />
                        <p className="text-2xl font-bold text-accent">23</p>
                        <p className="text-sm text-muted-foreground">New Today</p>
                      </CardContent>
                    </Card>
                    <Card className="education-card border-chart-2/20">
                      <CardContent className="p-4 text-center">
                        <Tag className="w-8 h-8 mx-auto mb-2 text-chart-2" />
                        <p className="text-2xl font-bold text-chart-2">89%</p>
                        <p className="text-sm text-muted-foreground">Pass Rate</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User List */}
                    <div className="lg:col-span-2">
                      <Card className="education-card border-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="cinzel text-xl font-bold">Recent Users</h3>
                            <Button className="floating-action px-4 py-2">
                              <Plus className="w-4 h-4 mr-2" />
                              Add User
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            {[
                              { name: "Sarah Chen", email: "sarah.chen@email.com", role: "Student", progress: 85, lastActive: "2 hours ago", status: "active" },
                              { name: "Michael Rodriguez", email: "m.rodriguez@email.com", role: "Student", progress: 92, lastActive: "5 minutes ago", status: "active" },
                              { name: "Emily Johnson", email: "emily.j@email.com", role: "Instructor", progress: 100, lastActive: "1 day ago", status: "inactive" },
                              { name: "David Kim", email: "david.kim@email.com", role: "Student", progress: 67, lastActive: "3 hours ago", status: "active" },
                              { name: "Lisa Thompson", email: "lisa.t@email.com", role: "Student", progress: 45, lastActive: "1 hour ago", status: "active" }
                            ].map((user, index) => (
                              <div key={index} className="flex items-center justify-between p-4 glassmorphism-card rounded-xl border border-border/50">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">{user.name.split(' ').map(n => n[0]).join('')}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{user.progress}% Complete</p>
                                    <p className="text-xs text-muted-foreground">{user.lastActive}</p>
                                  </div>
                                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-green-500/20 text-green-600 border-green-500/30' : ''}>
                                    {user.role}
                                  </Badge>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* User Activity */}
                    <div>
                      <Card className="education-card border-secondary/20">
                        <CardContent className="p-6">
                          <h3 className="cinzel text-lg font-bold mb-4">Live Activity</h3>
                          <div className="space-y-3">
                            {[
                              { action: "Started quiz: Health Insurance", user: "Sarah C.", time: "2m ago", type: "quiz" },
                              { action: "Completed lesson: HMO Basics", user: "Michael R.", time: "5m ago", type: "lesson" },
                              { action: "AI chat with CoachBot", user: "David K.", time: "8m ago", type: "ai" },
                              { action: "Generated iFlash cards", user: "Lisa T.", time: "12m ago", type: "flashcard" },
                              { action: "Earned CE certificate", user: "Emily J.", time: "15m ago", type: "certificate" }
                            ].map((activity, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 glassmorphism-card rounded-lg border border-border/30">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  activity.type === 'quiz' ? 'bg-accent' :
                                  activity.type === 'lesson' ? 'bg-primary' :
                                  activity.type === 'ai' ? 'bg-secondary' :
                                  activity.type === 'flashcard' ? 'bg-chart-2' :
                                  'bg-chart-4'
                                }`}></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{activity.action}</p>
                                  <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* AI Agents Tab */}
              <TabsContent value="agents">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <h3 className="cinzel text-xl font-bold mb-6">Agent Configuration</h3>
                        
                        <Tabs value={selectedAgent} onValueChange={setSelectedAgent}>
                          <TabsList className="grid grid-cols-3 mb-6">
                            <TabsTrigger value="coachbot" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                              CoachBot
                            </TabsTrigger>
                            <TabsTrigger value="studybuddy" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
                              StudyBuddy
                            </TabsTrigger>
                            <TabsTrigger value="proctorbot" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                              ProctorBot
                            </TabsTrigger>
                          </TabsList>

                          {currentAgent && (
                            <div className="space-y-6">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">System Prompt</Label>
                                <Textarea
                                  value={currentAgent.systemPrompt}
                                  onChange={(e) => {
                                    const updated = { ...currentAgent, systemPrompt: e.target.value };
                                    handleAgentUpdate(currentAgent.id, updated);
                                  }}
                                  className="min-h-32 bg-input border-border"
                                  placeholder="Enter system prompt..."
                                  data-testid="input-system-prompt"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Model</Label>
                                  <Select
                                    value={currentAgent.model}
                                    onValueChange={(value) => {
                                      const updated = { ...currentAgent, model: value };
                                      handleAgentUpdate(currentAgent.id, updated);
                                    }}
                                  >
                                    <SelectTrigger className="bg-input border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="gpt-5">gpt-5</SelectItem>
                                      <SelectItem value="gpt-5-mini">gpt-5-mini</SelectItem>
                                      <SelectItem value="gpt-4.1-mini">gpt-4.1-mini</SelectItem>
                                      <SelectItem value="llama-3.1-70b-instruct">llama-3.1-70b-instruct</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Temperature</Label>
                                  <Input
                                    type="number"
                                    value={currentAgent.temperature}
                                    onChange={(e) => {
                                      const updated = { ...currentAgent, temperature: parseFloat(e.target.value) };
                                      handleAgentUpdate(currentAgent.id, updated);
                                    }}
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    className="bg-input border-border"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Max Tokens</Label>
                                  <Input
                                    type="number"
                                    value={currentAgent.maxTokens}
                                    onChange={(e) => {
                                      const updated = { ...currentAgent, maxTokens: parseInt(e.target.value) };
                                      handleAgentUpdate(currentAgent.id, updated);
                                    }}
                                    className="bg-input border-border"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium mb-2 block">Guardrails</Label>
                                <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Require citations for all instructional content</span>
                                    <Switch
                                      checked={currentAgent.guardrails.requireCitations}
                                      onCheckedChange={(checked) => {
                                        const updated = {
                                          ...currentAgent,
                                          guardrails: { ...currentAgent.guardrails, requireCitations: checked }
                                        };
                                        handleAgentUpdate(currentAgent.id, updated);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Deny content coaching during exams</span>
                                    <Switch
                                      checked={currentAgent.guardrails.denyDuringExam}
                                      onCheckedChange={(checked) => {
                                        const updated = {
                                          ...currentAgent,
                                          guardrails: { ...currentAgent.guardrails, denyDuringExam: checked }
                                        };
                                        handleAgentUpdate(currentAgent.id, updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <h3 className="cinzel font-bold mb-4">Test Agent</h3>
                        <div className="space-y-3">
                          <Button
                            onClick={() => handleTestAgent(selectedAgent)}
                            disabled={testAgentMutation.isPending}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            data-testid="button-test-agent"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {testAgentMutation.isPending ? "Testing..." : "Run Test Query"}
                          </Button>
                          
                          <div className="p-3 bg-card rounded-lg text-sm">
                            <p className="text-muted-foreground mb-2">Test Query:</p>
                            <p>"Why is balance billing restricted under HMOs?"</p>
                          </div>
                          
                          {testResult && (
                            <div className="p-3 bg-card rounded-lg text-xs">
                              <p className="text-muted-foreground mb-2">Response:</p>
                              <pre className="text-wrap overflow-hidden">{testResult}</pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <h3 className="cinzel font-bold mb-4">Agent Statistics</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Avg Response Time</span>
                            <span className="font-semibold">2.3s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Citations Rate</span>
                            <span className="font-semibold">98%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Usage (24h)</span>
                            <span className="font-semibold">234 queries</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Error Rate</span>
                            <span className="font-semibold">0.2%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glassmorphism border-border">
                      <CardContent className="p-6">
                        <h3 className="cinzel font-bold mb-4">Actions</h3>
                        <div className="space-y-3">
                          <Button 
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            data-testid="button-save-config"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Configuration
                          </Button>
                          <Button variant="outline" className="w-full">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset to Defaults
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Question Banks Tab */}
              <TabsContent value="banks">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="glassmorphism border-border">
                    <CardContent className="p-6">
                      <h3 className="cinzel text-xl font-bold mb-6">Question Banks</h3>
                      
                      {banksLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-16 bg-muted rounded-xl"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {questionBanks?.map((bank) => (
                            <Card key={bank.id} className="border border-border">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{bank.title}</h4>
                                  <Badge variant="outline">
                                    {Math.floor(bank.timeLimitSec / 60)} min
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {bank.description}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {bank.topics.map((topic) => (
                                    <Badge key={topic} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )) || (
                            <p className="text-muted-foreground text-center py-8">
                              No question banks available.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism border-border">
                    <CardContent className="p-6">
                      <h3 className="cinzel text-xl font-bold mb-6">Bank Statistics</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-card rounded-xl text-center">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold text-primary">{questionBanks?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Banks</p>
                        </div>
                        <div className="p-4 bg-card rounded-xl text-center">
                          <HelpCircle className="w-8 h-8 mx-auto mb-2 text-secondary" />
                          <p className="text-2xl font-bold text-secondary">1,247</p>
                          <p className="text-sm text-muted-foreground">Total Questions</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Coverage by Topic</h4>
                        {[
                          { topic: "Law & Ethics", count: 180, percentage: 85 },
                          { topic: "Health Insurance", count: 245, percentage: 92 },
                          { topic: "OASDI", count: 156, percentage: 78 },
                          { topic: "Life Insurance", count: 198, percentage: 88 },
                          { topic: "Annuities", count: 123, percentage: 72 }
                        ].map((item) => (
                          <div key={item.topic} className="flex items-center justify-between">
                            <span className="text-sm">{item.topic}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">{item.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="glassmorphism border-border">
                    <CardContent className="p-6">
                      <h3 className="cinzel text-xl font-bold mb-6">Platform Usage</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-card rounded-xl text-center">
                          <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold text-primary">847</p>
                          <p className="text-sm text-muted-foreground">Active Students</p>
                        </div>
                        <div className="p-4 bg-card rounded-xl text-center">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-secondary" />
                          <p className="text-2xl font-bold text-secondary">12,394</p>
                          <p className="text-sm text-muted-foreground">Lessons Completed</p>
                        </div>
                        <div className="p-4 bg-card rounded-xl text-center">
                          <HelpCircle className="w-8 h-8 mx-auto mb-2 text-accent" />
                          <p className="text-2xl font-bold text-accent">3,421</p>
                          <p className="text-sm text-muted-foreground">Quizzes Taken</p>
                        </div>
                        <div className="p-4 bg-card rounded-xl text-center">
                          <Tag className="w-8 h-8 mx-auto mb-2 text-chart-4" />
                          <p className="text-2xl font-bold text-chart-4">156</p>
                          <p className="text-sm text-muted-foreground">Certificates Issued</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Recent Activity</h4>
                        <div className="space-y-2">
                          {[
                            { action: "New student registration", time: "2 minutes ago" },
                            { action: "Quiz completed: Health Insurance", time: "5 minutes ago" },
                            { action: "CE certificate generated", time: "12 minutes ago" },
                            { action: "Agent query: CoachBot", time: "18 minutes ago" }
                          ].map((activity, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-card rounded">
                              <span className="text-sm">{activity.action}</span>
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism border-border">
                    <CardContent className="p-6">
                      <h3 className="cinzel text-xl font-bold mb-6">Performance Metrics</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Course Completion Rate</span>
                            <span className="text-sm text-primary">73%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "73%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Average Quiz Score</span>
                            <span className="text-sm text-secondary">86%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-secondary h-2 rounded-full" style={{ width: "86%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Student Satisfaction</span>
                            <span className="text-sm text-accent">92%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-accent h-2 rounded-full" style={{ width: "92%" }}></div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                          <h4 className="font-semibold mb-3">Top Performing Tracks</h4>
                          <div className="space-y-2">
                            {[
                              { track: "Law & Ethics", score: "89%" },
                              { track: "Health Insurance", score: "86%" },
                              { track: "Life Insurance", score: "84%" }
                            ].map((item) => (
                              <div key={item.track} className="flex justify-between items-center">
                                <span className="text-sm">{item.track}</span>
                                <Badge variant="secondary">{item.score}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* CE Management Tab */}
              <TabsContent value="ce">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="glassmorphism border-border">
                    <CardContent className="p-6">
                      <h3 className="cinzel text-xl font-bold mb-6">CE Requirements</h3>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-card rounded-xl border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Law & Ethics (Required)</h4>
                            <Badge className="bg-primary/20 text-primary">4 Hours</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Mandatory 4-hour continuing education unit
                          </p>
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate:</span>
                            <span className="text-primary font-medium">94%</span>
                          </div>
                        </div>

                        <div className="p-4 bg-card rounded-xl border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Elective Credits</h4>
                            <Badge variant="outline">20 Hours</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Additional professional development hours
                          </p>
                          <div className="flex justify-between text-sm">
                            <span>Average Progress:</span>
                            <span className="text-secondary font-medium">67%</span>
                          </div>
                        </div>

                        <div className="p-4 bg-card rounded-xl border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Certificates Issued</h4>
                            <Badge variant="outline">This Month</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-primary">42</p>
                              <p className="text-xs text-muted-foreground">Law & Ethics</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-secondary">28</p>
                              <p className="text-xs text-muted-foreground">Elective</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism border-border">
                    <CardContent className="p-6">
                      <h3 className="cinzel text-xl font-bold mb-6">Tag Management</h3>
                      
                      <div className="space-y-4">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Bulk Certificates
                        </Button>
                        
                        <Button variant="outline" className="w-full">
                          <Database className="w-4 h-4 mr-2" />
                          Export CE Records
                        </Button>

                        <div className="pt-4 border-t border-border">
                          <h4 className="font-semibold mb-3">Recent Certificates</h4>
                          <div className="space-y-2">
                            {[
                              { student: "John Smith", course: "Law & Ethics", date: "2024-01-15" },
                              { student: "Sarah Johnson", course: "Health Insurance", date: "2024-01-14" },
                              { student: "Mike Wilson", course: "Life Insurance", date: "2024-01-14" }
                            ].map((cert, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-card rounded">
                                <div>
                                  <p className="text-sm font-medium">{cert.student}</p>
                                  <p className="text-xs text-muted-foreground">{cert.course}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{cert.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                          <h4 className="font-semibold mb-3">Compliance Status</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Students in Compliance</span>
                              <Badge className="bg-green-500/20 text-green-400">789</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Pending Requirements</span>
                              <Badge variant="outline">58</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Overdue</span>
                              <Badge className="bg-red-500/20 text-red-400">12</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
