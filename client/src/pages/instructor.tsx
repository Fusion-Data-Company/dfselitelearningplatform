import { useQuery } from "@tanstack/react-query";
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
  CheckCircle,
  Layers3,
  GraduationCap,
  Users,
  BarChart3
} from "lucide-react";

interface LessonItem {
  id: string;
  slug: string;
  title: string;
  track: string;
  module: string;
  trackId: string;
  estMinutes: number;
  ceHours: number;
  hasDFS215Structure?: boolean;
  stageCount?: number;
  checkpointCount?: number;
}

export default function InstructorPage() {
  // Query full lesson library with enhanced info
  const { data: lessons = [], isLoading } = useQuery<LessonItem[]>({
    queryKey: ['/api/lessons/enhanced-list'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/lessons/enhanced-list');
        if (!response.ok) throw new Error('Failed to fetch lessons');
        const lessonsData = await response.json();
        
        // Ensure we have an array
        if (!Array.isArray(lessonsData)) {
          console.warn('Lessons data is not an array:', lessonsData);
          return [];
        }
        
        // Map to expected format with enhanced fields
        return lessonsData.map((lesson: any) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          trackId: lesson.trackId || 'default',
          track: lesson.track || 'DFS-215 Course Content',
          module: lesson.module || 'Professional Content',
          estMinutes: lesson.estMinutes || 25,
          ceHours: lesson.ceHours || 0,
          hasDFS215Structure: lesson.hasDFS215Structure || false,
          stageCount: lesson.stageCount || 0,
          checkpointCount: lesson.checkpointCount || 0
        }));
      } catch (error) {
        console.error('Error fetching lessons:', error);
        return [];
      }
    }
  });

  // Parse messy track titles into clean academic format
  const parseTrackTitle = (messyTitle: string = '') => {
    if (!messyTitle || typeof messyTitle !== 'string') {
      return 'Professional Course';
    }
    
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

  // Group lessons by track for organized display
  const groupedLessons = (lessons && Array.isArray(lessons)) ? lessons.reduce((groups, lesson) => {
    if (!lesson) return groups;
    const trackTitle = parseTrackTitle(lesson.track);
    if (!groups[trackTitle]) {
      groups[trackTitle] = [];
    }
    groups[trackTitle].push(lesson);
    return groups;
  }, {} as Record<string, LessonItem[]>) : {};

  // Calculate summary statistics
  const totalLessons = (lessons && Array.isArray(lessons)) ? lessons.length : 0;
  const totalCEHours = (lessons && Array.isArray(lessons)) ? lessons.reduce((sum, lesson) => sum + (lesson?.ceHours || 0), 0) : 0;
  const totalMinutes = (lessons && Array.isArray(lessons)) ? lessons.reduce((sum, lesson) => sum + (lesson?.estMinutes || 0), 0) : 0;
  const dfs215Lessons = (lessons && Array.isArray(lessons)) ? lessons.filter(lesson => lesson?.hasDFS215Structure).length : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Futuristic Tech Background */}
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(/instructor-bg.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen relative z-10">
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Futuristic Tech Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: `url(/instructor-bg.jpg)`,
          backgroundSize: 'auto',
          backgroundPosition: 'center center',
          backgroundRepeat: 'repeat'
        }}
      />
      
      <Navigation />
      <Sidebar />
      
      <main className="ml-96 pt-16 min-h-screen relative z-10">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            {/* Instructor Portal Header */}
            <Card className="glassmorphism-card border-secondary/30 mb-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-shimmer mb-2" style={{fontFamily: 'Cinzel, serif'}}>
                          🎓 Instructor Portal
                        </h1>
                        <p className="text-lg text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>
                          DFS-215 Elite Learning Platform • Comprehensive Lesson Access
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{totalLessons}</p>
                        <p className="text-sm text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>Total Lessons</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">{totalCEHours}</p>
                        <p className="text-sm text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>CE Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-secondary">{Math.round(totalMinutes / 60)}</p>
                        <p className="text-sm text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>Est. Hours</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glassmorphism-card p-4 text-center">
                    <Layers3 className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold text-primary">{Object.keys(groupedLessons).length} Tracks</p>
                  </div>
                  <div className="glassmorphism-card p-4 text-center">
                    <Target className="w-6 h-6 text-accent mx-auto mb-2" />
                    <p className="text-sm font-semibold text-accent">{dfs215Lessons} Enhanced</p>
                  </div>
                  <div className="glassmorphism-card p-4 text-center">
                    <Users className="w-6 h-6 text-secondary mx-auto mb-2" />
                    <p className="text-sm font-semibold text-secondary">Ready for Students</p>
                  </div>
                  <div className="glassmorphism-card p-4 text-center">
                    <BarChart3 className="w-6 h-6 text-chart-2 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-chart-2">Live Analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Table of Contents */}
            <div className="space-y-8">
              <Card className="education-card border-primary/20">
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-elite mb-6 flex items-center space-x-3" style={{fontFamily: 'Cinzel, serif'}}>
                    <BookOpen className="w-8 h-8" />
                    <span>📚 Complete Lesson Library</span>
                  </h2>
                  
                  {Object.keys(groupedLessons).length > 0 ? (
                    <div className="space-y-8">
                      {Object.entries(groupedLessons).map(([trackTitle, trackLessons]) => (
                        <div key={trackTitle} className="space-y-4">
                          {/* Track Header */}
                          <div className="flex items-center justify-between p-4 glassmorphism-card rounded-xl">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-elite" style={{fontFamily: 'Cinzel, serif'}}>
                                  {trackTitle}
                                </h3>
                                <p className="text-sm text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>
                                  {trackLessons.length} lessons • {trackLessons.reduce((sum, l) => sum + (l.ceHours || 0), 0)} CE Hours
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/30" style={{fontFamily: 'Cinzel, serif'}}>
                              {trackLessons.length} Lessons
                            </Badge>
                          </div>

                          {/* Lessons Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                            {trackLessons.map((lesson, index) => (
                              <Link key={lesson.id} href={`/lesson/${lesson.slug}`}>
                                <Card className="education-card academic-course-card p-6 cursor-pointer group hover:border-primary/40 transition-all duration-300 h-full min-h-[200px]">
                                  <div className="space-y-4 h-full flex flex-col">
                                    <div className="flex items-center justify-between">
                                      <Badge className="bg-secondary/20 text-secondary border-secondary/30" style={{fontFamily: 'Cinzel, serif'}}>
                                        Lesson {index + 1}
                                      </Badge>
                                      {lesson.ceHours > 0 && (
                                        <Badge className="bg-accent/20 text-accent border-accent/30" style={{fontFamily: 'Cinzel, serif'}}>
                                          <Award className="w-3 h-3 mr-1" />
                                          {lesson.ceHours} CE
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2 flex-grow" style={{fontFamily: 'Cinzel, serif'}}>
                                      {lesson.title}
                                    </h4>

                                    {lesson.hasDFS215Structure && (
                                      <div className="flex items-center space-x-2 text-xs text-primary">
                                        <CheckCircle className="w-3 h-3" />
                                        <span style={{fontFamily: 'Cinzel, serif'}}>DFS-215 Enhanced • {lesson.stageCount} Stages • {lesson.checkpointCount} Checkpoints</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between pt-4 mt-auto">
                                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span style={{fontFamily: 'Cinzel, serif'}}>{lesson.estMinutes || 25} min</span>
                                      </div>
                                      <Button size="sm" className="floating-action text-xs px-4 py-2" style={{fontFamily: 'Cinzel, serif'}}>
                                        <Play className="w-4 h-4 mr-2" />
                                        Launch
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-muted-foreground mb-2" style={{fontFamily: 'Cinzel, serif'}}>Loading Lesson Library</h3>
                      <p className="text-muted-foreground" style={{fontFamily: 'Cinzel, serif'}}>Encyclopedia-grade DFS-215 content is being prepared...</p>
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