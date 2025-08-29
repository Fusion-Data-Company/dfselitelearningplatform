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
  ChevronRight 
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="cinzel text-3xl font-bold text-foreground mb-2">
                Student Dashboard
              </h2>
              <p className="text-muted-foreground">
                Welcome back, {user?.firstName || 'Student'}! Track your progress through the DFS-215 curriculum
              </p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Tracks */}
              <div className="space-y-6">
                <Card className="glassmorphism border-border">
                  <CardContent className="p-6">
                    <h3 className="cinzel text-xl font-bold mb-4">Course Tracks</h3>
                    <div className="space-y-4">
                      {progressLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-20 bg-muted rounded-xl"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        courseProgress?.tracks.map((track) => (
                          <Card 
                            key={track.id}
                            className="p-4 bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                            data-testid={`track-${track.id}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {track.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {track.ceHours > 0 && (
                                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                                    {track.ceHours}-Hr CE
                                  </Badge>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {track.completedLessons} of {track.totalLessons} lessons completed
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="w-full bg-muted rounded-full h-2 mr-3">
                                <div 
                                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${track.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-primary min-w-0">
                                {track.progress}%
                              </span>
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
                <Card className="glassmorphism border-border">
                  <CardContent className="p-6">
                    <h3 className="cinzel text-xl font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-card rounded-xl">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
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

                {/* AI Agents Quick Access */}
                <Card className="ai-agent-panel border-primary/30">
                  <CardContent className="p-6">
                    <h3 className="cinzel text-xl font-bold mb-4">AI Study Assistants</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        variant="ghost"
                        className="p-3 h-auto bg-card/50 hover:bg-card justify-start"
                        data-testid="button-coachbot"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <Brain className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">CoachBot</p>
                            <p className="text-xs text-muted-foreground">Ask questions, get explanations</p>
                          </div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        className="p-3 h-auto bg-card/50 hover:bg-card justify-start"
                        data-testid="button-studybuddy"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                            <Play className="w-4 h-4 text-secondary" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">StudyBuddy</p>
                            <p className="text-xs text-muted-foreground">Plan your study schedule</p>
                          </div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="ghost"
                        className="p-3 h-auto bg-card/50 hover:bg-card justify-start"
                        data-testid="button-proctorbot"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-accent" />
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
