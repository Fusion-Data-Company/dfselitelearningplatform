import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import ProgressCard from "@/components/ProgressCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, 
  Brain, 
  Shield, 
  TrendingUp, 
  Flame, 
  Layers3, 
  Award, 
  Play,
  ChevronRight,
  BarChart3,
  Clock,
  Target,
  Users,
  Calendar,
  Star,
  Activity,
  Zap,
  Trophy,
  Bot
} from "lucide-react";

interface CourseProgress {
  tracks: Array<{
    id: string;
    title: string;
    progress: number;
    ceHours: number;
    completedLessons: number;
    totalLessons: number;
  }>;
  overallProgress: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: courseProgress, isLoading: progressLoading } = useQuery<CourseProgress>({
    queryKey: ['/api/courses/progress'],
  });

  return (
    <div className="min-h-screen education-bg particle-field floating-elements">
      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="ultra-glass rounded-2xl p-8 mb-8 micro-glow animate-quantum">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 morphing-bg rounded-2xl flex items-center justify-center animate-divine micro-bounce">
                  <BarChart3 className="w-8 h-8 text-white drop-shadow-lg animate-cosmic" />
                </div>
                <div>
                  <h1 className="cinzel text-4xl font-bold holographic-text mb-2" data-text="Elite Dashboard">
                    Elite Dashboard
                  </h1>
                  <p className="text-lg text-muted-foreground geist animate-particle">
                    Welcome back, {user?.firstName || 'Student'}! Track your progress through the DFS-215 curriculum
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2 micro-glow">
                  <TrendingUp className="w-4 h-4 text-primary animate-quantum" />
                  <span className="animate-particle">Real-time Progress</span>
                </div>
                <div className="flex items-center space-x-2 micro-glow">
                  <Brain className="w-4 h-4 text-secondary animate-cosmic" />
                  <span className="animate-particle">AI-Powered Learning</span>
                </div>
                <div className="flex items-center space-x-2 micro-glow">
                  <Shield className="w-4 h-4 text-accent animate-divine" />
                  <span className="animate-particle">Certification Ready</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <ProgressCard
                title="Overall Progress"
                value={`${courseProgress?.overallProgress || 0}%`}
                icon={TrendingUp}
                gradient="from-primary to-primary/80"
                testId="card-overall-progress"
              />
              
              <ProgressCard
                title="Study Streak"
                value="12 days"
                icon={Flame}
                gradient="from-secondary to-secondary/80"
                testId="card-study-streak"
              />
              
              <ProgressCard
                title="iFlash Due"
                value="27"
                icon={Layers3}
                gradient="from-accent to-accent/80"
                testId="card-iflash-due"
              />
              
              <ProgressCard
                title="CE Hours"
                value="4.5/24"
                icon={Award}
                gradient="from-chart-4 to-chart-4/80"
                testId="card-ce-hours"
              />
            </div>

            {/* Advanced Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Real-time Performance Chart */}
              <div className="lg:col-span-2 chart-container p-6 neural-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 morphing-bg rounded-xl flex items-center justify-center animate-quantum">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="cinzel text-xl font-bold holographic-text">Performance Analytics</h3>
                      <p className="text-sm text-muted-foreground">Real-time learning metrics</p>
                    </div>
                  </div>
                  <Badge className="divine-button px-3 py-1">Live</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="metric-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Study Efficiency</span>
                      <TrendingUp className="w-4 h-4 text-primary animate-quantum" />
                    </div>
                    <div className="metric-value text-2xl font-bold mt-2">94.2%</div>
                    <div className="elite-progress h-2 mt-3">
                      <div className="elite-progress-fill" style={{ width: '94.2%' }}></div>
                    </div>
                  </div>
                  
                  <div className="metric-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Retention Rate</span>
                      <Brain className="w-4 h-4 text-secondary animate-cosmic" />
                    </div>
                    <div className="metric-value text-2xl font-bold mt-2">87.6%</div>
                    <div className="elite-progress h-2 mt-3">
                      <div className="elite-progress-fill" style={{ width: '87.6%' }}></div>
                    </div>
                  </div>
                  
                  <div className="metric-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Exam Readiness</span>
                      <Target className="w-4 h-4 text-accent animate-divine" />
                    </div>
                    <div className="metric-value text-2xl font-bold mt-2">92.1%</div>
                    <div className="elite-progress h-2 mt-3">
                      <div className="elite-progress-fill" style={{ width: '92.1%' }}></div>
                    </div>
                  </div>
                  
                  <div className="metric-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AI Interaction</span>
                      <Zap className="w-4 h-4 text-chart-4 animate-morphing" />
                    </div>
                    <div className="metric-value text-2xl font-bold mt-2">156</div>
                    <div className="text-xs text-muted-foreground mt-1">Sessions this week</div>
                  </div>
                </div>
                
                <div className="h-48 ultra-glass p-4 rounded-xl">
                  <div className="text-center py-16 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 animate-quantum" />
                    <p className="font-medium">Advanced Performance Chart</p>
                    <p className="text-sm">Real-time learning analytics visualization</p>
                  </div>
                </div>
              </div>
              
              {/* AI Learning Assistant Panel */}
              <div className="neural-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 morphing-bg rounded-xl flex items-center justify-center animate-divine">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="cinzel text-lg font-bold holographic-text">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Your learning companion</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="ultra-glass p-4 rounded-xl micro-glow">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">StudyBuddy</p>
                        <p className="text-xs text-muted-foreground">Ready to help with Law & Ethics concepts</p>
                      </div>
                      <Badge className="text-xs px-2 py-1 bg-primary/20 text-primary">Active</Badge>
                    </div>
                  </div>
                  
                  <div className="ultra-glass p-4 rounded-xl micro-glow">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">CoachBot</p>
                        <p className="text-xs text-muted-foreground">Motivational learning strategies</p>
                      </div>
                      <Badge className="text-xs px-2 py-1 bg-secondary/20 text-secondary">Ready</Badge>
                    </div>
                  </div>
                  
                  <div className="ultra-glass p-4 rounded-xl micro-glow">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">ProctorBot</p>
                        <p className="text-xs text-muted-foreground">Exam supervision and monitoring</p>
                      </div>
                      <Badge className="text-xs px-2 py-1 bg-accent/20 text-accent">Standby</Badge>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full mt-6 divine-button" data-testid="button-chat-ai">
                  <Brain className="w-4 h-4 mr-2" />
                  Start AI Chat Session
                </Button>
              </div>
            </div>
            
            {/* Enhanced Learning Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="ultra-glass micro-glow micro-tilt animate-quantum">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold holographic-text" data-text="Study Time Today">Study Time Today</h3>
                    <Clock className="w-5 h-5 text-accent animate-cosmic" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Learning</span>
                      <span className="font-bold text-accent">2h 35m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Goal</span>
                      <span className="text-sm text-muted-foreground">3h 00m</span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div className="morphing-bg h-2 rounded-full animate-divine" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="ultra-glass micro-glow micro-tilt animate-cosmic">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold holographic-text" data-text="This Week">This Week</h3>
                    <Activity className="w-5 h-5 text-chart-2 animate-divine" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lessons</span>
                      <span className="font-bold text-chart-2">8 completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Quizzes</span>
                      <span className="font-bold text-chart-2">3 passed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Score</span>
                      <span className="font-bold text-chart-2">89%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="ultra-glass micro-glow micro-tilt animate-divine">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold holographic-text" data-text="Achievements">Achievements</h3>
                    <Trophy className="w-5 h-5 text-chart-4 animate-quantum" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Quiz Master</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Study Streak</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Speed Learner</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Tracks */}
              <div className="space-y-6">
                <Card className="ultra-glass micro-glow animate-quantum">
                  <CardContent className="p-8">
                    <h3 className="cinzel text-2xl font-bold mb-6 holographic-text" data-text="Course Tracks">Course Tracks</h3>
                    <div className="space-y-4">
                      {progressLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="elite-skeleton h-24 rounded-2xl"></div>
                          ))}
                        </div>
                      ) : (
                        courseProgress?.tracks.map((track) => (
                          <Card 
                            key={track.id}
                            className="ultra-glass p-5 cursor-pointer group relative overflow-hidden micro-glow micro-tilt"
                            data-testid={`track-${track.id}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-xl morphing-bg flex items-center justify-center animate-divine micro-bounce">
                                    <BookOpen className="w-6 h-6 text-white animate-cosmic" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                                      {track.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {track.completedLessons} of {track.totalLessons} lessons
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {track.ceHours > 0 && (
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                      {track.ceHours}-Hr CE
                                    </Badge>
                                  )}
                                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Progress
                                  </span>
                                  <span className="text-sm font-bold text-primary">{track.progress}%</span>
                                </div>
                                <div className="w-full bg-muted/30 rounded-full h-3 relative overflow-hidden">
                                  <div 
                                    className="morphing-bg h-3 rounded-full transition-all duration-500 ease-out relative animate-divine"
                                    style={{ width: `${track.progress}%` }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-quantum"></div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Next: {track.progress < 100 ? 'Continue Learning' : 'Review Complete'}</span>
                                <Button size="sm" className="divine-button text-xs px-3 py-1 text-white font-bold micro-tilt">
                                  {track.progress < 100 ? 'Continue' : 'Review'}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card className="ultra-glass micro-glow animate-cosmic">
                  <CardContent className="p-8">
                    <h3 className="cinzel text-2xl font-bold mb-6 holographic-text" data-text="Recent Activity">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 ultra-glass rounded-2xl micro-glow group">
                        <div className="w-10 h-10 morphing-bg rounded-xl flex items-center justify-center shadow-lg animate-divine micro-bounce">
                          <BookOpen className="w-4 h-4 text-primary animate-cosmic" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Completed HMO Balance Billing lesson</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-card rounded-xl">
                        <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                          <Layers3 className="w-4 h-4 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Generated 15 iFlash cards</p>
                          <p className="text-xs text-muted-foreground">Yesterday</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-card rounded-xl">
                        <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                          <Award className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Passed Managed Care quiz (92%)</p>
                          <p className="text-xs text-muted-foreground">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Agents Quick Access */}
                <Card className="ultra-glass micro-glow animate-divine">
                  <CardContent className="p-6">
                    <h3 className="cinzel text-xl font-bold mb-4 holographic-text" data-text="AI Study Assistants">AI Study Assistants</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        variant="ghost"
                        className="divine-button p-3 h-auto justify-start text-white font-medium micro-tilt"
                        data-testid="button-coachbot"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 morphing-bg rounded-lg flex items-center justify-center animate-quantum micro-bounce">
                            <Brain className="w-4 h-4 text-white animate-cosmic" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">CoachBot</p>
                            <p className="text-xs text-muted-foreground">Ask questions, get explanations</p>
                          </div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        className="divine-button p-3 h-auto justify-start text-white font-medium micro-tilt"
                        data-testid="button-studybuddy"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 morphing-bg rounded-lg flex items-center justify-center animate-divine micro-bounce">
                            <Play className="w-4 h-4 text-white animate-holographic" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">StudyBuddy</p>
                            <p className="text-xs text-muted-foreground">Plan your study schedule</p>
                          </div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        className="divine-button p-3 h-auto justify-start text-white font-medium micro-tilt"
                        data-testid="button-proctorbot"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 morphing-bg rounded-lg flex items-center justify-center animate-cosmic micro-bounce">
                            <Shield className="w-4 h-4 text-white animate-quantum" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">ProctorBot</p>
                            <p className="text-xs text-muted-foreground">Exam guidance and support</p>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
