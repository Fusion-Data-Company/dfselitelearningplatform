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
  // Helper function to get color hex values for glows
  const getColorForGlow = (colorClass: string): string => {
    const colorMap: { [key: string]: string } = {
      'text-primary': '#6366f1',
      'text-secondary': '#f59e0b', 
      'text-accent': '#10b981',
      'text-destructive': '#ef4444',
      'text-chart-2': '#8b5cf6',
      'text-chart-3': '#06b6d4',
      'text-chart-4': '#f97316',
      'text-chart-5': '#84cc16'
    };
    return colorMap[colorClass] || '#6366f1';
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
    <aside className="fixed left-0 top-16 bottom-0 w-64 glassmorphism-card border-r border-border/30 backdrop-blur-[32px] p-6 overflow-y-auto">
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
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`sidebar-nav w-full justify-start h-auto p-4 geist font-medium relative group overflow-hidden ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500/25 via-black/30 to-cyan-700/20 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/30 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_2s_ease-in-out_infinite] backdrop-blur-md' 
                        : 'hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-black/20 hover:to-cyan-700/10 hover:shadow-md hover:shadow-cyan-500/20 hover:backdrop-blur-sm'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      boxShadow: isActive 
                        ? `0 0 25px #06b6d430, 0 0 45px #06b6d415, inset 0 1px 0 rgba(255,255,255,0.1)`
                        : undefined
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.boxShadow = `0 0 20px #06b6d425, 0 0 35px #06b6d412, inset 0 1px 0 rgba(255,255,255,0.05)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.boxShadow = '';
                      }
                    }}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-black/40 mr-3 flex-shrink-0 border border-cyan-500/30">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-300 animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : item.color} transition-all duration-300`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium leading-tight ${isActive ? 'text-cyan-200' : 'text-foreground'} transition-colors duration-300 block`}>
                        {item.label}
                      </span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 ml-2 text-cyan-300 animate-pulse drop-shadow-[0_0_6px_rgba(6,182,212,0.8)] flex-shrink-0" />}
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
              const colors = [
                { border: 'border-primary/30 hover:border-primary/50', badge: 'from-primary/30 to-primary/20 text-primary border-primary/40', text: 'group-hover:text-primary', progress: 'lesson-progress' },
                { border: 'border-secondary/30 hover:border-secondary/50', badge: 'from-secondary/30 to-secondary/20 text-secondary border-secondary/40', text: 'group-hover:text-secondary', progress: 'bg-gradient-to-r from-secondary via-secondary/90 to-secondary/80' },
                { border: 'border-accent/30 hover:border-accent/50', badge: 'from-accent/30 to-accent/20 text-accent border-accent/40', text: 'group-hover:text-accent', progress: 'bg-gradient-to-r from-accent via-accent/90 to-accent/80' }
              ];
              const color = colors[index % 3];
              
              return (
                <Link key={track.id} href="/lesson/HMO-balance-billing">
                  <div 
                    className={`p-4 education-card border ${color.border} transition-all duration-300 group cursor-pointer hover:shadow-lg relative overflow-hidden`}
                    style={{
                      boxShadow: `0 0 15px #06b6d415, 0 0 25px #06b6d408, inset 0 1px 0 rgba(255,255,255,0.05)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 25px #06b6d425, 0 0 40px #06b6d415, inset 0 1px 0 rgba(255,255,255,0.1)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 15px #06b6d415, 0 0 25px #06b6d408, inset 0 1px 0 rgba(255,255,255,0.05)`;
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 animate-pulse"></div>
                          <span className="text-sm font-bold text-cyan-100 cinzel tracking-wide">
                            {track.title.length > 18 ? track.title.substring(0, 18) + '...' : track.title}
                          </span>
                        </div>
                        <Badge className="bg-gradient-to-r from-cyan-500/30 to-cyan-700/30 text-cyan-200 text-xs font-bold border border-cyan-500/50 backdrop-blur-sm">
                          {track.progress}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gradient-to-r from-black/60 via-gray-800/40 to-black/60 rounded-full h-3 relative overflow-hidden border border-cyan-500/20">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 h-3 rounded-full transition-all duration-700 relative overflow-hidden" 
                          style={{ width: `${track.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-cyan-300 bg-gradient-to-r from-black/70 to-black/50 px-2 py-1 rounded border border-cyan-500/30 geist font-medium">
                          {track.completedLessons}/{track.totalLessons} lessons
                        </span>
                        <span className="text-xs text-cyan-400 cinzel font-semibold">
                          Click to Start →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {(!courseProgress || courseProgress.tracks.length === 0) && (
              <>
                <div className="p-5 education-card border border-primary/30 hover:border-primary/50 transition-all duration-300 group">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-foreground geist group-hover:text-primary transition-colors">Loading Progress...</span>
                    <Badge className="elite-badge bg-gradient-to-r from-primary/30 to-primary/20 text-primary border-primary/40 text-xs font-semibold">
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
