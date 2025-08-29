import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function Sidebar() {
  const [location] = useLocation();

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
    <aside className="fixed left-0 top-16 bottom-0 w-64 ultra-glass border-r border-border/30 p-6 overflow-y-auto particle-field">
      <div className="space-y-6">
        {/* Navigation Menu */}
        <div className="space-y-2">
          <h3 className="cinzel text-sm font-bold holographic-text uppercase tracking-wider mb-4" data-text="Navigation">
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
                    className={`ultra-glass w-full justify-start h-auto p-4 geist font-medium micro-bounce micro-glow ${
                      isActive ? 'animate-divine border-2 border-primary/50 micro-shimmer' : 'hover:animate-quantum'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-primary animate-cosmic' : item.color} transition-all duration-300`} />
                    <span className="text-sm">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary animate-quantum" />}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Course Progress */}
        <div className="space-y-2">
          <h3 className="cinzel text-sm font-bold holographic-text uppercase tracking-wider mb-4" data-text="Course Progress">
            Course Progress
          </h3>
          <div className="space-y-3">
            <div className="p-5 ultra-glass micro-glow micro-tilt animate-quantum group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-foreground geist group-hover:text-primary transition-colors animate-particle">Law & Ethics</span>
                <Badge className="divine-button text-xs px-3 py-1">
                  85%
                </Badge>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner">
                <div className="lesson-progress h-3 rounded-full morphing-bg animate-divine" style={{ width: "85%" }}></div>
              </div>
            </div>
            
            <div className="p-5 ultra-glass micro-glow micro-tilt animate-cosmic group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-foreground geist group-hover:text-secondary transition-colors animate-particle">Health Insurance</span>
                <Badge className="divine-button text-xs px-3 py-1">
                  65%
                </Badge>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner">
                <div className="morphing-bg h-3 rounded-full transition-all duration-500 relative overflow-hidden animate-holographic" style={{ width: "65%" }}>
                  <div className="absolute inset-0 bg-white/20 animate-quantum"></div>
                </div>
              </div>
            </div>
            
            <div className="p-5 ultra-glass micro-glow micro-tilt animate-morphing group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-foreground geist group-hover:text-accent transition-colors animate-particle">OASDI & Medicare</span>
                <Badge className="divine-button text-xs px-3 py-1">
                  40%
                </Badge>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner">
                <div className="morphing-bg h-3 rounded-full transition-all duration-500 relative overflow-hidden animate-cosmic" style={{ width: "40%" }}>
                  <div className="absolute inset-0 bg-white/20 animate-divine"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
