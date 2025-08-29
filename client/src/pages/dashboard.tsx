import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import ProgressCard from "@/components/ProgressCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
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
  Trophy
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

interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  duration: number;
  ceHours: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: courseProgress, isLoading: progressLoading } = useQuery<CourseProgress>({
    queryKey: ['/api/courses/progress'],
  });
  
  const { data: recentLessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons/recent'],
    queryFn: async () => {
      // Get recent lessons with content
      const response = await fetch('/api/lessons/recent');
      if (!response.ok) {
        // Fallback to getting all lessons if recent endpoint doesn't exist
        const allResponse = await fetch('/api/lessons');
        if (allResponse.ok) {
          const lessons = await allResponse.json();
          return lessons.slice(0, 5); // Get first 5 lessons
        }
        return [];
      }
      return response.json();
    },
  });

  return (
    <div className="min-h-screen education-bg">
      <Navigation />
      <Sidebar />
      
      <main className="ml-96 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="glassmorphism-card rounded-2xl p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center animate-elite-glow">
                  <BarChart3 className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h1 className="cinzel text-4xl font-bold text-shimmer mb-2">
                    Elite Dashboard
                  </h1>
                  <p className="text-lg text-muted-foreground geist">
                    Welcome back, {user?.firstName || 'Student'}! Track your progress through the DFS-215 curriculum
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Real-time Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-secondary" />
                  <span>AI-Powered Learning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Certification Ready</span>
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

            {/* Performance Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="education-card border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold">Study Time Today</h3>
                    <Clock className="w-5 h-5 text-accent" />
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
                      <div className="bg-accent h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="education-card border-chart-2/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold">This Week</h3>
                    <Activity className="w-5 h-5 text-chart-2" />
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
              
              <Card className="education-card border-chart-4/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold">Achievements</h3>
                    <Trophy className="w-5 h-5 text-chart-4" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Quiz Master</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-primary" />
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
                <Card className="education-card border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <h3 className="cinzel text-2xl font-bold mb-6 text-elite">Course Tracks</h3>
                    <div className="space-y-4">
                      {progressLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="elite-skeleton h-24 rounded-2xl"></div>
                          ))}
                        </div>
                      ) : (
                        courseProgress?.tracks.map((track) => {
                          // Create a URL for the first lesson in this track
                          const trackUrl = `/track/${track.id}`;
                          
                          return (
                            <Link key={track.id} href={trackUrl}>
                              <Card 
                                className="education-card p-5 cursor-pointer group relative overflow-hidden"
                                data-testid={`track-${track.id}`}
                              >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-white" />
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
                                    className="premium-gradient h-3 rounded-full transition-all duration-500 ease-out relative"
                                    style={{ width: `${track.progress}%` }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Next: {track.progress < 100 ? 'Continue Learning' : 'Review Complete'}</span>
                                <Button size="sm" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30">
                                  {track.progress < 100 ? 'Continue' : 'Review'}
                                </Button>
                              </div>
                            </div>
                              </Card>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card className="education-card border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <h3 className="cinzel text-2xl font-bold mb-6 text-elite">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 glassmorphism-card rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-300 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <BookOpen className="w-4 h-4 text-primary" />
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

                {/* Recent Lessons with Content Preview */}
                <Card className="education-card border-accent/20 hover:border-accent/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <h3 className="cinzel text-2xl font-bold mb-6 text-elite">Recent Lessons</h3>
                    <div className="space-y-4">
                      {lessonsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="elite-skeleton h-20 rounded-xl"></div>
                          ))}
                        </div>
                      ) : recentLessons && recentLessons.length > 0 ? (
                        recentLessons.map((lesson) => {
                          // Extract first 3 lines of content for preview
                          const contentLines = lesson.content ? 
                            lesson.content.split('\n').filter(line => line.trim().length > 0).slice(0, 3) : 
                            [lesson.description || 'No content available'];
                          const preview = contentLines.join(' ').substring(0, 200) + '...';
                          
                          return (
                            <Link key={lesson.id} href={`/lesson/${lesson.slug}`}>
                              <Card className="education-card p-4 cursor-pointer group hover:border-accent/40 transition-all duration-300">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm group-hover:text-accent transition-colors line-clamp-1">
                                      {lesson.title}
                                    </h4>
                                    {lesson.ceHours > 0 && (
                                      <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                                        {lesson.ceHours} CE
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-3">
                                    {preview}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{lesson.duration} min</span>
                                    <ChevronRight className="w-3 h-3 group-hover:text-accent transition-colors" />
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">No lessons available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions - Functional */}
                <Card className="ai-agent-panel border-primary/30">
                  <CardContent className="p-6">
                    <h3 className="cinzel text-xl font-bold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Link href="/agents">
                        <Button 
                          variant="ghost"
                          className="w-full p-3 h-auto bg-card/50 hover:bg-card justify-start"
                          data-testid="button-ai-assistants"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                              <Brain className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">AI Study Assistants</p>
                              <p className="text-xs text-muted-foreground">Chat with your AI tutors</p>
                            </div>
                          </div>
                        </Button>
                      </Link>
                      
                      <Link href="/iflash">
                        <Button 
                          variant="ghost"
                          className="w-full p-3 h-auto bg-card/50 hover:bg-card justify-start"
                          data-testid="button-flashcards"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                              <Layers3 className="w-4 h-4 text-secondary" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">iFlash Study Cards</p>
                              <p className="text-xs text-muted-foreground">Review flashcards & concepts</p>
                            </div>
                          </div>
                        </Button>
                      </Link>
                      
                      <Link href="/exam">
                        <Button 
                          variant="ghost"
                          className="w-full p-3 h-auto bg-card/50 hover:bg-card justify-start"
                          data-testid="button-practice-exam"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                              <Shield className="w-4 h-4 text-accent" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Practice Exam</p>
                              <p className="text-xs text-muted-foreground">Test your knowledge</p>
                            </div>
                          </div>
                        </Button>
                      </Link>
                      
                      <Link href="/ce-tracking">
                        <Button 
                          variant="ghost"
                          className="w-full p-3 h-auto bg-card/50 hover:bg-card justify-start"
                          data-testid="button-ce-hours"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-chart-4/20 rounded-lg flex items-center justify-center">
                              <Award className="w-4 h-4 text-chart-4" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">CE Hour Tracking</p>
                              <p className="text-xs text-muted-foreground">Monitor your progress</p>
                            </div>
                          </div>
                        </Button>
                      </Link>
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
