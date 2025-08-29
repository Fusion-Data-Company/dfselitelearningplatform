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
                    className={`sidebar-nav w-full justify-start h-auto p-4 geist font-medium relative group ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary/20 to-secondary/15 text-primary border border-primary/30 shadow-lg shadow-primary/20' 
                        : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/8 hover:shadow-md hover:shadow-primary/10'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      boxShadow: isActive 
                        ? `0 0 20px ${getColorForGlow(item.color)}20, 0 0 40px ${getColorForGlow(item.color)}10`
                        : undefined
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.boxShadow = `0 0 15px ${getColorForGlow(item.color)}15, 0 0 30px ${getColorForGlow(item.color)}08`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.boxShadow = '';
                      }
                    }}
                  >
                    <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-primary animate-pulse' : item.color} transition-all duration-300 drop-shadow-lg`} />
                    <span className="text-sm">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary animate-pulse" />}
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
                <div 
                  key={track.id} 
                  className={`p-4 education-card border ${color.border} transition-all duration-300 group cursor-pointer hover:shadow-lg`}
                  style={{
                    boxShadow: `0 0 15px ${getColorForGlow(getColorForIndex(index))}15, 0 0 25px ${getColorForGlow(getColorForIndex(index))}08`
                  }}
                  onMouseEnter={(e) => {
                    const color = getColorForGlow(getColorForIndex(index));
                    e.currentTarget.style.boxShadow = `0 0 20px ${color}25, 0 0 35px ${color}15`;
                  }}
                  onMouseLeave={(e) => {
                    const color = getColorForGlow(getColorForIndex(index));
                    e.currentTarget.style.boxShadow = `0 0 15px ${color}15, 0 0 25px ${color}08`;
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-white bg-black/70 px-2 py-1 rounded transition-colors">
                      {track.title.length > 15 ? track.title.substring(0, 15) + '...' : track.title}
                    </span>
                    <Badge className="bg-white/90 text-black text-xs font-bold border-0">
                      {track.progress}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${track.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                    {track.completedLessons}/{track.totalLessons} lessons
                  </div>
                </div>
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
