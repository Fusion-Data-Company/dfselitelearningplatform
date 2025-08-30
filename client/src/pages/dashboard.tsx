import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import ProgressCard from "@/components/ProgressCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import dashboardBg from "@/assets/dashboard-bg.png";
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Futuristic Tech Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${dashboardBg})`,
          filter: 'brightness(0.3) contrast(1.2)' // Make it darker/more subtle
        }}
      />
      {/* Cyan overlay to reduce pink/purple and brighten */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-slate-900/50" />
      
      <Navigation />
      <Sidebar />
      
      <main className="ml-96 pt-16 min-h-screen relative z-10">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 mb-8 shadow-2xl shadow-cyan-500/20">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <BarChart3 className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h1 className="cinzel text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    Elite Dashboard
                  </h1>
                  <p className="text-lg text-cyan-100/80 geist">
                    Welcome back, {user?.firstName || 'Student'}! Track your progress through the DFS-215 curriculum
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-cyan-200/70">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Real-time Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span>AI-Powered Learning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-cyan-300" />
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
                gradient="from-cyan-500 to-cyan-600"
                testId="card-overall-progress"
              />
              
              <ProgressCard
                title="Study Streak"
                value="12 days"
                icon={Flame}
                gradient="from-blue-500 to-blue-600"
                testId="card-study-streak"
              />
              
              <ProgressCard
                title="iFlash Due"
                value="27"
                icon={Layers3}
                gradient="from-cyan-500 to-cyan-600"
                testId="card-iflash-due"
              />
              
              <ProgressCard
                title="CE Hours"
                value="4.5/24"
                icon={Award}
                gradient="from-slate-600 to-slate-700"
                testId="card-ce-hours"
              />
            </div>

            {/* Performance Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-900/70 backdrop-blur-xl border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold text-cyan-100">Study Time Today</h3>
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-cyan-200/70">Active Learning</span>
                      <span className="font-bold text-cyan-400">2h 35m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-cyan-200/70">Goal</span>
                      <span className="text-sm text-cyan-200/70">3h 00m</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div className="bg-cyan-400 h-2 rounded-full shadow-lg shadow-cyan-400/30" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/70 backdrop-blur-xl border-blue-500/20 shadow-lg shadow-blue-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold text-blue-100">This Week</h3>
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-200/70">Lessons</span>
                      <span className="font-bold text-blue-400">8 completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-200/70">Quizzes</span>
                      <span className="font-bold text-blue-400">3 passed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-200/70">Average Score</span>
                      <span className="font-bold text-blue-400">89%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-500/20 shadow-lg shadow-slate-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="cinzel text-lg font-bold text-slate-100">Achievements</h3>
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-cyan-100">Quiz Master</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-cyan-100">Study Streak</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Speed Learner</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Tracks */}
              <div className="space-y-6">
                <Card className="bg-slate-900/70 backdrop-blur-xl border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 shadow-lg shadow-cyan-500/10">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent" style={{fontFamily: 'Cinzel, serif'}}>Course Tracks</h3>
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
                          
                          // Parse messy track title into clean academic format
                          const parseTrackTitle = (messyTitle: string) => {
                            const cleanPatterns = {
                              'iPower|Instructor.*Seminar|LIVE.*Day': 'Professional Sales Training Seminar',
                              'Law.*Ethics|Ethics.*Law|Professional.*Responsibility': 'Professional Ethics & Law',
                              'Health.*Insurance.*Content|DFS.*Health': 'Health Insurance Fundamentals',
                              'Managed.*Care|HMO|PPO|EPO': 'Managed Care Organizations',
                              'Social.*Insurance|OASDI|Medicare': 'Social Insurance & Medicare',
                              'Disability.*Income|Income.*Insurance': 'Disability Income Insurance',
                              'Life.*Insurance|Term.*Life|Whole.*Life': 'Life Insurance Products',
                              'Annuities|Variable.*Products': 'Annuities & Variable Products',
                              'FIGA|DFS|CFO|Florida.*Guaranty': 'Florida Insurance Regulation'
                            };
                            
                            for (const [pattern, cleanTitle] of Object.entries(cleanPatterns)) {
                              if (new RegExp(pattern, 'i').test(messyTitle)) {
                                return cleanTitle;
                              }
                            }
                            
                            // Fallback: extract first meaningful part
                            if (messyTitle.length > 50) {
                              let clean = messyTitle.split(/[|,\d+]/)[0]?.trim();
                              if (clean && clean.length > 10 && clean.length < 60) {
                                return clean.replace(/BEGIN|NEXT|LIVE/gi, '').trim();
                              }
                            }
                            
                            return messyTitle.length > 40 ? 'Professional Development Course' : messyTitle;
                          };
                          
                          const cleanTitle = parseTrackTitle(track.title);

                          return (
                            <Link key={track.id} href={trackUrl}>
                              <Card 
                                className="education-card p-5 cursor-pointer group relative overflow-hidden academic-course-card"
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
                                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors" style={{fontFamily: 'Cinzel, serif'}}>
                                      {cleanTitle}
                                    </h4>
                                    <p className="text-sm text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>
                                      {track.completedLessons} of {track.totalLessons} lessons
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {track.ceHours > 0 && (
                                    <Badge className="bg-primary/20 text-primary border-primary/30" style={{fontFamily: 'Cinzel, serif'}}>
                                      {track.ceHours}-Hr CE
                                    </Badge>
                                  )}
                                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>
                                    Progress
                                  </span>
                                  <span className="text-sm font-bold text-primary" style={{fontFamily: 'Cinzel, serif'}}>{track.progress}%</span>
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
                                <span className="text-xs text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>Next: {track.progress < 100 ? 'Continue Learning' : 'Review Complete'}</span>
                                <Button size="sm" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30" style={{fontFamily: 'Cinzel, serif'}}>
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
                    <h3 className="text-2xl font-bold mb-6 text-elite" style={{fontFamily: 'Cinzel, serif'}}>Recent Activity</h3>
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
