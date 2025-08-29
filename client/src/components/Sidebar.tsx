import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  BookOpen, 
  HelpCircle, 
  Clock, 
  Layers3, 
  Brain,
  Award,
  Settings,
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

export default function Sidebar() {
  // Helper function to get color schemes for each navigation item
  const getColorScheme = (colorClass: string) => {
    const colorSchemes: { [key: string]: any } = {
      'text-primary': {
        name: 'primary',
        hex: '#06b6d4',
        glow: '#06b6d4',
        rgb: '6, 182, 212',
        activeGradient: 'from-cyan-500/25 via-cyan-800/30 to-cyan-700/20',
        hoverGradient: 'from-cyan-500/15 via-cyan-800/20 to-cyan-700/10',
        borderColor: 'border-cyan-400/40',
        textColor: 'text-cyan-300',
        iconBg: 'from-cyan-500/20 to-cyan-800/40',
        iconBorder: 'border-cyan-500/30'
      },
      'text-secondary': {
        name: 'secondary',
        hex: '#10b981',
        glow: '#10b981',
        rgb: '16, 185, 129',
        activeGradient: 'from-emerald-500/25 via-emerald-800/30 to-emerald-700/20',
        hoverGradient: 'from-emerald-500/15 via-emerald-800/20 to-emerald-700/10',
        borderColor: 'border-emerald-400/40',
        textColor: 'text-emerald-300',
        iconBg: 'from-emerald-500/20 to-emerald-800/40',
        iconBorder: 'border-emerald-500/30'
      },
      'text-accent': {
        name: 'accent',
        hex: '#10b981',
        glow: '#10b981',
        rgb: '16, 185, 129',
        activeGradient: 'from-emerald-500/25 via-emerald-800/30 to-emerald-700/20',
        hoverGradient: 'from-emerald-500/15 via-emerald-800/20 to-emerald-700/10',
        borderColor: 'border-emerald-400/40',
        textColor: 'text-emerald-300',
        iconBg: 'from-emerald-500/20 to-emerald-800/40',
        iconBorder: 'border-emerald-500/30'
      },
      'text-destructive': {
        name: 'destructive',
        hex: '#ef4444',
        glow: '#ef4444',
        rgb: '239, 68, 68',
        activeGradient: 'from-red-500/25 via-red-800/30 to-red-700/20',
        hoverGradient: 'from-red-500/15 via-red-800/20 to-red-700/10',
        borderColor: 'border-red-400/40',
        textColor: 'text-red-300',
        iconBg: 'from-red-500/20 to-red-800/40',
        iconBorder: 'border-red-500/30'
      },
      'text-chart-2': {
        name: 'chart-2',
        hex: '#8b5cf6',
        glow: '#8b5cf6',
        rgb: '139, 92, 246',
        activeGradient: 'from-violet-500/25 via-violet-800/30 to-violet-700/20',
        hoverGradient: 'from-violet-500/15 via-violet-800/20 to-violet-700/10',
        borderColor: 'border-violet-400/40',
        textColor: 'text-violet-300',
        iconBg: 'from-violet-500/20 to-violet-800/40',
        iconBorder: 'border-violet-500/30'
      },
      'text-chart-3': {
        name: 'chart-3',
        hex: '#3b82f6',
        glow: '#3b82f6',
        rgb: '59, 130, 246',
        activeGradient: 'from-blue-500/25 via-blue-800/30 to-blue-700/20',
        hoverGradient: 'from-blue-500/15 via-blue-800/20 to-blue-700/10',
        borderColor: 'border-blue-400/40',
        textColor: 'text-blue-300',
        iconBg: 'from-blue-500/20 to-blue-800/40',
        iconBorder: 'border-blue-500/30'
      },
      'text-chart-4': {
        name: 'chart-4',
        hex: '#f97316',
        glow: '#f97316',
        rgb: '249, 115, 22',
        activeGradient: 'from-orange-500/25 via-orange-800/30 to-orange-700/20',
        hoverGradient: 'from-orange-500/15 via-orange-800/20 to-orange-700/10',
        borderColor: 'border-orange-400/40',
        textColor: 'text-orange-300',
        iconBg: 'from-orange-500/20 to-orange-800/40',
        iconBorder: 'border-orange-500/30'
      },
      'text-chart-5': {
        name: 'chart-5',
        hex: '#ec4899',
        glow: '#ec4899',
        rgb: '236, 72, 153',
        activeGradient: 'from-pink-500/25 via-pink-800/30 to-pink-700/20',
        hoverGradient: 'from-pink-500/15 via-pink-800/20 to-pink-700/10',
        borderColor: 'border-pink-400/40',
        textColor: 'text-pink-300',
        iconBg: 'from-pink-500/20 to-pink-800/40',
        iconBorder: 'border-pink-500/30'
      }
    };
    return colorSchemes[colorClass] || colorSchemes['text-primary'];
  };

  const getColorForIndex = (index: number): string => {
    const colors = ['text-primary', 'text-secondary', 'text-accent'];
    return colors[index % 3];
  };
  const [location] = useLocation();
  
  const { data: courseProgress } = useQuery<CourseProgress>({
    queryKey: ['/api/courses/progress'],
  });

  const navItems = [
    { href: "/", icon: BarChart3, label: "Dashboard", color: "text-primary" },
    { href: "/lesson/hmo-balance-billing", icon: BookOpen, label: "Lesson Player", color: "text-secondary" },
    { href: "/quiz", icon: HelpCircle, label: "Practice Quiz", color: "text-accent" },
    { href: "/exam", icon: Clock, label: "Timed Exam", color: "text-destructive" },
    { href: "/iflash", icon: Layers3, label: "iFlash Review", color: "text-chart-2" },
    { href: "/agents", icon: Brain, label: "AI Agents", color: "text-chart-3" },
    { href: "/ce-tracking", icon: Award, label: "CE Tracking", color: "text-chart-5" },
    { href: "/admin", icon: Settings, label: "Admin Panel", color: "text-chart-4" },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-96 glassmorphism-card border-r border-border/30 backdrop-blur-[32px] p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Menu */}
        <div className="space-y-2">
          <h3 className="cinzel text-sm font-bold text-elite uppercase tracking-wider mb-4">
            Navigation
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                (item.href !== "/" && location.startsWith(item.href));
              const colorScheme = getColorScheme(item.color);
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`sidebar-nav w-full justify-start h-auto p-4 geist font-medium relative group overflow-hidden transition-all duration-300 border backdrop-blur-md ${
                      isActive 
                        ? `bg-gradient-to-r ${colorScheme.activeGradient} ${colorScheme.textColor} ${colorScheme.borderColor} shadow-lg before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_2s_ease-in-out_infinite]` 
                        : `border-border/20`
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      boxShadow: isActive 
                        ? `0 0 25px ${colorScheme.hex}30, 0 0 45px ${colorScheme.hex}15, inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 60px rgba(${colorScheme.rgb}, 0.05)`
                        : `inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 3px rgba(0,0,0,0.2)`
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        // Force remove any existing glow and apply individual color
                        e.currentTarget.style.boxShadow = `0 0 25px ${colorScheme.hex}40, 0 0 45px ${colorScheme.hex}20, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 50px rgba(${colorScheme.rgb}, 0.12)`;
                        e.currentTarget.style.borderColor = `rgba(${colorScheme.rgb}, 0.5)`;
                        // Add text glow on hover
                        const textSpan = e.currentTarget.querySelector('span');
                        if (textSpan) {
                          textSpan.style.textShadow = `0 0 8px ${colorScheme.hex}80`;
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        // Reset to default subtle state
                        e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 3px rgba(0,0,0,0.2)`;
                        e.currentTarget.style.borderColor = '';
                        const textSpan = e.currentTarget.querySelector('span');
                        if (textSpan) {
                          textSpan.style.textShadow = '';
                        }
                      }
                    }}
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${colorScheme.iconBg} mr-4 flex-shrink-0 border ${colorScheme.iconBorder} relative overflow-hidden`}>
                      <Icon className={`w-6 h-6 ${isActive ? `${colorScheme.textColor} animate-pulse` : item.color} transition-all duration-300 relative z-10`} 
                        style={{
                          filter: isActive ? `drop-shadow(0 0 8px ${colorScheme.hex}aa)` : 'none',
                          transition: 'filter 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.filter = `drop-shadow(0 0 6px ${colorScheme.hex}60)`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.filter = 'none';
                          }
                        }}
                      />
                      {/* Removed overlay that blocks individual color glows */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-base font-medium leading-tight ${isActive ? colorScheme.textColor : 'text-foreground group-hover:text-foreground/90'} transition-colors duration-300 block`}>
                        {item.label}
                      </span>
                    </div>
                    {isActive && <ChevronRight className={`w-4 h-4 ml-2 ${colorScheme.textColor} animate-pulse flex-shrink-0`}
                      style={{
                        filter: `drop-shadow(0 0 6px ${colorScheme.hex}cc)`
                      }} 
                    />}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Course Progress */}
        <div className="space-y-2">
          <h3 className="cinzel text-sm font-bold text-elite uppercase tracking-wider mb-4">
            Course Progress
          </h3>
          <div className="space-y-3">
            {courseProgress?.tracks.slice(0, 3).map((track, index) => {
              const trackColors = [
                {
                  name: 'primary',
                  hex: '#06b6d4',
                  rgb: '6, 182, 212',
                  border: 'border-cyan-400/30 hover:border-cyan-400/50',
                  badge: 'from-cyan-500/30 to-cyan-700/30 text-cyan-200 border-cyan-500/50',
                  text: 'text-cyan-100',
                  dot: 'from-cyan-400 to-cyan-600',
                  shimmer: 'via-cyan-500/10'
                },
                {
                  name: 'secondary',
                  hex: '#10b981',
                  rgb: '16, 185, 129',
                  border: 'border-emerald-400/30 hover:border-emerald-400/50',
                  badge: 'from-emerald-500/30 to-emerald-700/30 text-emerald-200 border-emerald-500/50',
                  text: 'text-emerald-100',
                  dot: 'from-emerald-400 to-emerald-600',
                  shimmer: 'via-emerald-500/10'
                },
                {
                  name: 'accent',
                  hex: '#8b5cf6',
                  rgb: '139, 92, 246',
                  border: 'border-violet-400/30 hover:border-violet-400/50',
                  badge: 'from-violet-500/30 to-violet-700/30 text-violet-200 border-violet-500/50',
                  text: 'text-violet-100',
                  dot: 'from-violet-400 to-violet-600',
                  shimmer: 'via-violet-500/10'
                }
              ];
              const trackColor = trackColors[index % 3];
              
              // Generate academic course metadata
              const courseId = `DFS-215-${String(index + 1).padStart(3, '0')}`;
              const enrollmentStatus = track.progress === 100 ? 'Certified' : track.progress > 0 ? 'Enrolled' : 'Available';
              const courseDescription = 'Professional development course for DFS-215 certification requirements. Click to view detailed curriculum and learning objectives.';
              
              return (
                <Link key={track.id} href="/lesson/hmo-balance-billing">
                  <div 
                    className={`p-8 education-card border ${trackColor.border} transition-all duration-300 group cursor-pointer hover:shadow-lg relative overflow-hidden academic-course-card`}
                    title={`Course Description: ${courseDescription}`}
                    style={{
                      boxShadow: `0 0 15px ${trackColor.hex}15, 0 0 25px ${trackColor.hex}08, inset 0 1px 0 rgba(255,255,255,0.05)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 25px ${trackColor.hex}25, 0 0 40px ${trackColor.hex}15, inset 0 1px 0 rgba(255,255,255,0.1)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 15px ${trackColor.hex}15, 0 0 25px ${trackColor.hex}08, inset 0 1px 0 rgba(255,255,255,0.05)`;
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${trackColor.shimmer} to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000`}></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          {/* Academic Course Header */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${trackColor.dot} flex-shrink-0`}></div>
                            <span className="text-sm font-mono text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors" title={`Course ID: ${courseId}`}>
                              {courseId}
                            </span>
                          </div>
                          
                          {/* Course Title */}
                          <h3 className={`text-xl font-bold ${trackColor.text} cinzel tracking-wide leading-snug mb-3 hover:${trackColor.text.replace('text-', 'text-').replace('-100', '-50')} transition-colors cursor-pointer`} title={courseDescription} style={{fontFamily: 'Cinzel, serif'}}>
                            {track.title}
                          </h3>
                          
                          {/* Course Metadata */}
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center space-x-2 cinzel font-medium">
                              <div className="w-2 h-2 rounded-full bg-current opacity-60 flex-shrink-0"></div>
                              <span>{track.ceHours || 0} CE Hours</span>
                            </span>
                            <span className="flex items-center space-x-2 cinzel font-medium">
                              <div className="w-2 h-2 rounded-full bg-current opacity-60 flex-shrink-0"></div>
                              <span>{track.completedLessons}/{track.totalLessons} Lessons</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-3">
                          <Badge className={`bg-gradient-to-r ${trackColor.badge} text-sm font-bold border backdrop-blur-sm px-3 py-1.5 cinzel`} style={{fontFamily: 'Cinzel, serif'}}>
                            {track.progress}%
                          </Badge>
                          <span className="text-sm text-muted-foreground cinzel font-medium" style={{fontFamily: 'Cinzel, serif'}}>
                            {track.progress === 100 ? 'Complete' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                      <div className={`w-full bg-gradient-to-r from-black/60 via-gray-800/40 to-black/60 rounded-full h-3 relative overflow-hidden border border-${trackColor.name === 'primary' ? 'cyan' : trackColor.name === 'secondary' ? 'emerald' : 'violet'}-500/20`}>
                        <div 
                          className={`bg-gradient-to-r ${trackColor.dot} h-3 rounded-full transition-all duration-700 relative overflow-hidden`}
                          style={{ width: `${track.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <span className={`text-sm ${trackColor.text} bg-gradient-to-r from-black/50 to-black/30 px-4 py-2 rounded-lg border border-${trackColor.name === 'primary' ? 'cyan' : trackColor.name === 'secondary' ? 'emerald' : 'violet'}-500/20 cinzel font-medium flex items-center space-x-3`} style={{fontFamily: 'Cinzel, serif'}}>
                            <span className="opacity-70">Status:</span>
                            <span className="font-semibold">
                              {enrollmentStatus}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className={`${trackColor.text} cinzel font-semibold opacity-80 group-hover:opacity-100 transition-opacity`} style={{fontFamily: 'Cinzel, serif'}}>
                            Enter Course
                          </span>
                          <ChevronRight className={`w-5 h-5 ${trackColor.text} opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {(!courseProgress || courseProgress.tracks.length === 0) && (
              <>
                <div className="p-5 education-card border border-border/30 hover:border-border/50 transition-all duration-300 group">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-foreground geist transition-colors">Loading Progress...</span>
                    <Badge className="elite-badge bg-gradient-to-r from-muted/30 to-muted/20 text-muted-foreground border-border/40 text-xs font-semibold">
                      --%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner">
                    <div className="lesson-progress h-3 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
