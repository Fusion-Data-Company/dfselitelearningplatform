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
  Play,
  Target,
  CheckCircle
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
  estMinutes: number;
  ceHours: number;
  trackId: string;
  track: string;
  module: string;
}

// Parse messy track titles into clean academic format
const parseTrackTitle = (messyTitle: string) => {
  const cleanPatterns = {
    'Table.*Contents': 'Course Overview & Table of Contents',
    'Identify.*Disability.*INCOME|Disability.*INCOME.*Insurance': 'Disability Income Insurance',
    'iPower|Instructor.*Seminar|LIVE.*Day': 'Professional Sales Training',
    'Law.*Ethics|Ethics.*Law|Professional.*Responsibility': 'Professional Ethics & Law',
    'Health.*Insurance.*Content|DFS.*Health': 'Health Insurance Fundamentals',
    'Managed.*Care|HMO|PPO|EPO': 'Managed Care Organizations',
    'Social.*Insurance|OASDI|Medicare': 'Social Insurance & Medicare',
    'AD&D|Accidental.*Death.*Dismemberment': 'Accidental Death & Dismemberment',
    'HOSPITAL.*Indemnity|Medical.*Expense': 'Medical Expense Insurance',
    'Life.*Insurance|Term.*Life|Whole.*Life': 'Life Insurance Products',
    'Annuities|Variable.*Products': 'Annuities & Variable Products',
    'FIGA|DFS|CFO|Florida.*Guaranty': 'Florida Insurance Regulation'
  };
  
  for (const [pattern, cleanTitle] of Object.entries(cleanPatterns)) {
    if (new RegExp(pattern, 'i').test(messyTitle)) {
      return cleanTitle;
    }
  }
  
  // Fallback: extract first meaningful part and clean it
  if (messyTitle.length > 50) {
    let clean = messyTitle.split(/[\[\]|\d+]/)[0]?.trim();
    if (clean && clean.length > 10 && clean.length < 60) {
      return clean.replace(/BEGIN|NEXT|LIVE|Identify/gi, '').trim();
    }
  }
  
  return messyTitle.length > 40 ? 'Professional Course' : messyTitle;
};

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
  
  // Query lessons directly for this track
  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons/recent'],
    queryFn: async () => {
      const response = await fetch('/api/lessons/recent');
      if (!response.ok) throw new Error('Failed to fetch lessons');
      return response.json();
    }
  });

  // Query enhanced lessons for better content display
  const { data: enhancedLessons } = useQuery<any[]>({
    queryKey: ['/api/lessons/enhanced-list'],
    queryFn: async () => {
      try {
        // Try to get enhanced lessons first
        const response = await fetch('/api/lessons/enhanced-list');
        if (!response.ok) {
          // Fall back to regular lessons if enhanced endpoint doesn't exist
          return [];
        }
        return response.json();
      } catch (error) {
        return [];
      }
    }
  });
  
  // Filter lessons for this track, prioritizing enhanced lessons if available
  const trackLessons = enhancedLessons && enhancedLessons.length > 0 
    ? enhancedLessons.filter(lesson => 
        lesson.trackId === trackId || 
        (lesson.track && track?.title && lesson.track.includes(track.title.substring(0, 20))) ||
        (track?.title && track.title.toLowerCase().includes('health') && lesson.slug?.includes('managed-care')) ||
        (track?.title && track.title.toLowerCase().includes('dfs') && lesson.slug?.includes('figa'))
      )
    : lessons?.filter(lesson => 
        lesson.trackId === trackId || 
        (lesson.track && track?.title && lesson.track.includes(track.title.substring(0, 20)))
      ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen">
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
        <main className="ml-96 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-6xl mx-auto text-center">
              <Card className="education-card p-12">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-foreground" style={{fontFamily: 'Cinzel, serif'}}>Track Not Found</h1>
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
                    <h1 className="text-4xl font-bold text-shimmer mb-2" style={{fontFamily: 'Cinzel, serif'}}>
                      {parseTrackTitle(track.title)}
                    </h1>
                    <p className="text-lg text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>
                      {track.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2" style={{fontFamily: 'Cinzel, serif'}}>
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{trackLessons.length} lessons</span>
                  </div>
                  {track.ceHours > 0 && (
                    <div className="flex items-center space-x-2" style={{fontFamily: 'Cinzel, serif'}}>
                      <Award className="w-4 h-4 text-accent" />
                      <span>{track.ceHours} CE Hours</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2" style={{fontFamily: 'Cinzel, serif'}}>
                    <Target className="w-4 h-4 text-secondary" />
                    <span>Est. {trackLessons.reduce((total, lesson) => total + (lesson.estMinutes || 0), 0)} minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lessons */}
            <div className="space-y-6">
              <Card className="education-card border-primary/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-elite mb-6 flex items-center space-x-3" style={{fontFamily: 'Cinzel, serif'}}>
                    <BookOpen className="w-6 h-6" />
                    <span>Course Lessons</span>
                  </h2>
                  
                  {trackLessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {trackLessons.map((lesson, index) => (
                        <Link key={lesson.id} href={`/lesson/${lesson.slug}`}>
                          <Card className="education-card academic-course-card p-6 cursor-pointer group hover:border-primary/40 transition-all duration-300 h-full min-h-[200px]">
                            <div className="space-y-4 h-full flex flex-col">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-primary/20 text-primary border-primary/30" style={{fontFamily: 'Cinzel, serif'}}>
                                  Lesson {index + 1}
                                </Badge>
                                {lesson.ceHours > 0 && (
                                  <Badge className="bg-accent/20 text-accent border-accent/30" style={{fontFamily: 'Cinzel, serif'}}>
                                    {lesson.ceHours} CE
                                  </Badge>
                                )}
                              </div>
                              
                              <h4 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2 flex-grow" style={{fontFamily: 'Cinzel, serif'}}>
                                {lesson.title}
                              </h4>
                              
                              <div className="flex items-center justify-between pt-4 mt-auto">
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span style={{fontFamily: 'Cinzel, serif'}}>{lesson.estMinutes || 5} min</span>
                                </div>
                                <Button size="sm" className="floating-action text-xs px-4 py-2" style={{fontFamily: 'Cinzel, serif'}}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-muted-foreground mb-2" style={{fontFamily: 'Cinzel, serif'}}>Course Content Loading</h3>
                      <p className="text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>Lessons will appear here once available.</p>
                      <Link href="/">
                        <Button className="floating-action mt-4" style={{fontFamily: 'Cinzel, serif'}}>
                          Return to Dashboard
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}