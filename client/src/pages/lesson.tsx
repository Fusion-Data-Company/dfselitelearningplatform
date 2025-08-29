import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import CoachBotModal from "@/components/CoachBotModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  BookOpen, 
  Play, 
  Layers3, 
  HelpCircle, 
  CheckCircle,
  Brain,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Home,
  Clock
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string;
  objectives: string[];
  duration: number;
  ceHours: number;
}

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeSection, setActiveSection] = useState("objectives");
  const [coachBotOpen, setCoachBotOpen] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ['/api/lessons/slug', slug],
    enabled: !!slug,
  });

  const progressMutation = useMutation({
    mutationFn: async (progress: { completed: boolean; timeSpent: number; progressPercent: number }) => {
      if (!lesson) throw new Error("No lesson found");
      await apiRequest("POST", `/api/lessons/${lesson.id}/progress`, progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/progress'] });
      toast({
        title: "Progress Updated",
        description: "Your lesson progress has been saved.",
      });
    },
  });

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save progress
  useEffect(() => {
    if (lesson && sessionTime > 0 && sessionTime % 30 === 0) { // Save every 30 seconds
      const progressPercent = activeSection === "objectives" ? 25 : 
                             activeSection === "reading" ? 75 : 100;
      
      progressMutation.mutate({
        completed: activeSection === "checkpoint",
        timeSpent: sessionTime,
        progressPercent
      });
    }
  }, [sessionTime, activeSection, lesson]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sections = [
    { id: "objectives", icon: Target, label: "Objectives" },
    { id: "reading", icon: BookOpen, label: "Reading" },
    { id: "media", icon: Play, label: "Media" },
    { id: "iflash", icon: Layers3, label: "iFlash" },
    { id: "practice", icon: HelpCircle, label: "Practice" },
    { id: "checkpoint", icon: CheckCircle, label: "Checkpoint" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        <main className="ml-64 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                <div className="elite-skeleton h-32 rounded-2xl"></div>
                <div className="elite-skeleton h-96 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        <main className="ml-64 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-6xl mx-auto text-center">
              <Card className="education-card p-12">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h1 className="cinzel text-3xl font-bold mb-4 text-foreground">Lesson Not Found</h1>
                <p className="text-muted-foreground mb-6">The requested lesson could not be found or has been moved.</p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="floating-action px-6 py-3"
                >
                  Return to Dashboard
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentProgress = activeSection === "objectives" ? 25 : 
                         activeSection === "reading" ? 75 : 100;

  const viewId = `lesson:${lesson.id}:${activeSection}`;

  return (
    <div className="min-h-screen education-bg">
      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            {/* Lesson Header */}
            <Card className="glassmorphism-card border-secondary/30 mb-8">
              <CardContent className="p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <Button variant="outline" size="sm" onClick={() => window.history.back()} className="border-primary/50 text-primary hover:bg-primary/10">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Course
                      </Button>
                      <Button
                        onClick={() => setCoachBotOpen(true)}
                        className="floating-action text-background font-semibold"
                        data-testid="button-coach-bot"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Ask CoachBot
                      </Button>
                    </div>
                    <h2 className="cinzel text-3xl font-bold text-shimmer mb-2" data-testid="lesson-title">
                      {lesson.title}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <p className="text-lg text-muted-foreground">
                        Health Insurance & Managed Care • Lesson 3.2
                      </p>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <Clock className="w-3 h-3 mr-1" />
                        {lesson.duration} min
                      </Badge>
                      {lesson.ceHours && (
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                          {lesson.ceHours} CE Hours
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="font-semibold text-primary">{currentProgress}%</p>
                    </div>
                    <div className="w-16 h-16 relative">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          stroke="currentColor" 
                          strokeWidth="10" 
                          fill="none" 
                          className="text-muted"
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          stroke="currentColor" 
                          strokeWidth="10" 
                          fill="none" 
                          strokeLinecap="round" 
                          className="text-primary" 
                          strokeDasharray="283" 
                          strokeDashoffset={283 - (283 * currentProgress / 100)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold">{currentProgress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Lesson Navigation */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <Button
                        key={section.id}
                        variant="ghost"
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                          isActive ? 'section-active' : 'hover:bg-muted'
                        }`}
                        data-testid={`section-${section.id}`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {section.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card className="education-card border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <CardContent className="p-8 relative overflow-hidden">
                    {activeSection === "objectives" && (
                      <div className="prose prose-invert max-w-none">
                        <h3 className="cinzel text-xl font-bold mb-4">Learning Objectives</h3>
                        <ul className="space-y-2 mb-6">
                          {lesson.objectives.map((objective, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>

                        <h4 className="cinzel text-lg font-semibold mb-3">Key Concept: Balance Billing Restrictions</h4>
                        <p className="mb-4">
                          In Health Maintenance Organizations (HMOs), network providers are contractually prohibited from balance billing subscribers. This restriction is fundamental to the managed care model and directly impacts both provider compensation and subscriber cost exposure.
                        </p>

                        <div className="bg-card p-6 rounded-xl border border-border mb-6">
                          <h5 className="font-semibold text-primary mb-3">
                            <Target className="w-5 h-5 inline mr-2" />
                            Important Definition
                          </h5>
                          <p className="text-sm">
                            <strong>Balance Billing:</strong> The practice of billing a patient for the difference between the provider's charged amount and the amount paid by the insurance plan. This practice is prohibited for in-network HMO providers.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeSection === "reading" && (
                      <div className="prose prose-invert max-w-none" data-testid="lesson-content">
                        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                      </div>
                    )}

                    {activeSection === "media" && (
                      <div className="text-center py-12">
                        <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="cinzel text-xl font-bold mb-2">Video Content</h3>
                        <p className="text-muted-foreground">Video lessons and demonstrations would be displayed here.</p>
                      </div>
                    )}

                    {activeSection === "iflash" && (
                      <div>
                        <div className="flex items-center space-x-3 mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-4 flex items-center justify-center">
                            <Layers3 className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="cinzel text-3xl font-bold text-shimmer">iFlash Spaced Repetition</h3>
                        </div>
                        
                        {/* Flashcard Interface */}
                        <div className="space-y-6">
                          <div className="glassmorphism-card rounded-2xl p-8 border border-chart-2/20 min-h-[300px] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-4/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                              <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-4 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                  <Layers3 className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="cinzel text-2xl font-bold mb-4 text-foreground">What is HMO Balance Billing?</h4>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed geist">
                                  Test your knowledge of this key insurance concept using spaced repetition.
                                </p>
                                <Button className="floating-action px-8 py-3">
                                  <Layers3 className="w-5 h-5 mr-2" />
                                  Reveal Answer
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Flashcard Controls */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Button variant="outline" className="p-4 h-auto border-destructive/30 hover:bg-destructive/10 transition-all duration-300">
                              <div className="text-center">
                                <div className="text-2xl mb-2">😰</div>
                                <div className="text-sm font-medium">Again</div>
                                <div className="text-xs text-muted-foreground">&lt; 1m</div>
                              </div>
                            </Button>
                            <Button variant="outline" className="p-4 h-auto border-orange-500/30 hover:bg-orange-500/10 transition-all duration-300">
                              <div className="text-center">
                                <div className="text-2xl mb-2">🤔</div>
                                <div className="text-sm font-medium">Hard</div>
                                <div className="text-xs text-muted-foreground">6m</div>
                              </div>
                            </Button>
                            <Button variant="outline" className="p-4 h-auto border-yellow-500/30 hover:bg-yellow-500/10 transition-all duration-300">
                              <div className="text-center">
                                <div className="text-2xl mb-2">😊</div>
                                <div className="text-sm font-medium">Good</div>
                                <div className="text-xs text-muted-foreground">1d</div>
                              </div>
                            </Button>
                            <Button variant="outline" className="p-4 h-auto border-green-500/30 hover:bg-green-500/10 transition-all duration-300">
                              <div className="text-center">
                                <div className="text-2xl mb-2">🚀</div>
                                <div className="text-sm font-medium">Easy</div>
                                <div className="text-xs text-muted-foreground">4d</div>
                              </div>
                            </Button>
                          </div>
                          
                          {/* Statistics */}
                          <div className="glassmorphism-card rounded-2xl p-6 border border-primary/20">
                            <h4 className="font-bold text-lg mb-4">Review Statistics</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-chart-2">12</div>
                                <div className="text-sm text-muted-foreground">Cards Due</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-chart-4">85%</div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">7</div>
                                <div className="text-sm text-muted-foreground">Day Streak</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === "practice" && (
                      <div>
                        <div className="flex items-center space-x-3 mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-chart-2 flex items-center justify-center">
                            <Edit3 className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="cinzel text-3xl font-bold text-shimmer">Practice Questions</h3>
                        </div>
                        
                        <div className="space-y-6">
                          {/* Sample Practice Question */}
                          <div className="glassmorphism-card rounded-2xl p-6 border border-accent/20">
                            <div className="mb-4">
                              <Badge className="elite-badge bg-gradient-to-r from-accent/30 to-accent/20 text-accent border-accent/40 mb-3">
                                Question 1 of 3
                              </Badge>
                              <h4 className="font-bold text-lg mb-4 leading-relaxed">In an HMO model, which of the following statements about balance billing is correct?</h4>
                            </div>
                            <div className="space-y-3">
                              {[
                                'A) HMO providers may balance bill for covered services',
                                'B) HMO providers are prohibited from balance billing members',
                                'C) Balance billing is allowed only for emergency services',
                                'D) Balance billing depends on the member\'s deductible amount'
                              ].map((option, index) => (
                                <Button 
                                  key={index}
                                  variant="outline" 
                                  className="w-full justify-start p-4 h-auto text-left hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 group"
                                >
                                  <span className="w-6 h-6 rounded-full bg-muted group-hover:bg-accent/20 flex items-center justify-center text-sm font-bold mr-3 transition-colors">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className="geist">{option}</span>
                                </Button>
                              ))}
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                              <Button variant="outline" className="border-muted-foreground/30 hover:bg-muted/20">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous
                              </Button>
                              <Button className="floating-action">
                                Submit Answer
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Practice Progress */}
                          <div className="glassmorphism-card rounded-2xl p-6 border border-secondary/20">
                            <h4 className="font-bold text-lg mb-4">Practice Progress</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-accent">2/3</div>
                                <div className="text-sm text-muted-foreground">Questions</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">100%</div>
                                <div className="text-sm text-muted-foreground">Accuracy</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-secondary">45s</div>
                                <div className="text-sm text-muted-foreground">Avg Time</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === "checkpoint" && (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
                        <h3 className="cinzel text-xl font-bold mb-2">Lesson Complete!</h3>
                        <p className="text-muted-foreground mb-6">
                          You've completed this lesson. Your progress has been saved.
                        </p>
                        <div className="space-y-4">
                          {lesson.ceHours > 0 && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              +{lesson.ceHours} CE Hours Earned
                            </Badge>
                          )}
                          <div className="flex justify-center space-x-4">
                            <Button variant="outline">
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Previous Lesson
                            </Button>
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                              Next Lesson
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Study Tools */}
                <Card className="glassmorphism border-border">
                  <CardContent className="p-4">
                    <h4 className="cinzel font-bold mb-3">Study Tools</h4>
                    <div className="space-y-2">
                      <Button
                        onClick={() => setCoachBotOpen(true)}
                        className="w-full justify-start bg-primary/20 text-primary hover:bg-primary/30"
                        data-testid="button-ask-coachbot"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Ask CoachBot
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start hover:bg-secondary/20"
                      >
                        <Layers3 className="w-4 h-4 mr-2" />
                        Generate iFlash
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start hover:bg-accent/20"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Take Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Tracking */}
                <Card className="glassmorphism border-border">
                  <CardContent className="p-4">
                    <h4 className="cinzel font-bold mb-3">Session Time</h4>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1" data-testid="session-time">
                        {formatTime(sessionTime)}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Learning</p>
                      {lesson.ceHours > 0 && (
                        <div className="mt-3 p-2 bg-card rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            CE Credit: {lesson.ceHours} hrs
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Navigation */}
                <Card className="glassmorphism border-border">
                  <CardContent className="p-4">
                    <h4 className="cinzel font-bold mb-3">Navigation</h4>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-muted"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2 text-muted-foreground" />
                        Previous Lesson
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-muted"
                      >
                        <ArrowRight className="w-4 h-4 mr-2 text-muted-foreground" />
                        Next Lesson
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-muted"
                      >
                        <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                        Module Overview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CoachBotModal 
        open={coachBotOpen} 
        onClose={() => setCoachBotOpen(false)} 
        viewId={viewId}
      />
    </div>
  );
}
