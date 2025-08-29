import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  BookOpen, 
  ChevronRight, 
  Clock,
  Award,
  Play
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  description: string;
  ceHours: number;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: number;
  ceHours: number;
  content: string;
}

export default function TrackPage() {
  const [match, params] = useRoute("/track/:trackId");
  const trackId = params?.trackId;

  const { data: track, isLoading } = useQuery<Track>({
    queryKey: ['/api/tracks', trackId],
    queryFn: async () => {
      const response = await fetch(`/api/tracks/${trackId}`);
      if (!response.ok) {
        throw new Error('Track not found');
      }
      return response.json();
    },
    enabled: !!trackId
  });

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

  if (!track) {
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
                <h1 className="cinzel text-3xl font-bold mb-4 text-foreground">Track Not Found</h1>
                <p className="text-muted-foreground mb-6">The requested track could not be found.</p>
                <Button onClick={() => window.location.href = '/'} className="floating-action px-6 py-3">
                  Return to Dashboard
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen education-bg">
      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            {/* Track Header */}
            <Card className="glassmorphism-card border-primary/30 mb-8">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center animate-elite-glow">
                    <BookOpen className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <h1 className="cinzel text-4xl font-bold text-shimmer mb-2">
                      {track.title}
                    </h1>
                    <p className="text-lg text-muted-foreground geist">
                      {track.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{track.modules?.reduce((total, module) => total + module.lessons.length, 0)} lessons</span>
                  </div>
                  {track.ceHours > 0 && (
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-accent" />
                      <span>{track.ceHours} CE Hours</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Modules and Lessons */}
            <div className="space-y-8">
              {track.modules?.map((module, moduleIndex) => (
                <Card key={module.id} className="education-card border-secondary/20">
                  <CardContent className="p-8">
                    <h2 className="cinzel text-2xl font-bold text-elite mb-6">
                      Module {moduleIndex + 1}: {module.title}
                    </h2>
                    <p className="text-muted-foreground mb-6">{module.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {module.lessons?.map((lesson, lessonIndex) => {
                        // Extract first 3 lines of content for preview
                        const contentLines = lesson.content ? 
                          lesson.content.split('\n').filter(line => line.trim().length > 0).slice(0, 3) : 
                          [lesson.description || 'No content available'];
                        const preview = contentLines.join(' ').substring(0, 150) + '...';
                        
                        return (
                          <Link key={lesson.id} href={`/lesson/${lesson.slug}`}>
                            <Card className="education-card p-4 cursor-pointer group hover:border-primary/40 transition-all duration-300 h-full">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                    Lesson {lessonIndex + 1}
                                  </Badge>
                                  {lesson.ceHours > 0 && (
                                    <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                                      {lesson.ceHours} CE
                                    </Badge>
                                  )}
                                </div>
                                
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2">
                                  {lesson.title}
                                </h4>
                                
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {preview}
                                </p>
                                
                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{lesson.duration} min</span>
                                  </div>
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                    <Play className="w-3 h-3 mr-1" />
                                    Start
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {!track.modules?.length && (
                <Card className="education-card p-8 text-center">
                  <p className="text-muted-foreground">No modules available for this track.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}