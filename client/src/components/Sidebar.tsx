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
                    className={`sidebar-nav w-full justify-start h-auto p-4 geist font-medium ${
                      isActive ? 'bg-gradient-to-r from-primary/20 to-secondary/15 text-primary border border-primary/30 shadow-lg' : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/8'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-primary animate-pulse' : item.color} transition-all duration-300`} />
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
            <div className="p-5 education-card border border-primary/30 hover:border-primary/50 transition-all duration-300 group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-foreground geist group-hover:text-primary transition-colors">Law & Ethics</span>
                <Badge className="elite-badge bg-gradient-to-r from-primary/30 to-primary/20 text-primary border-primary/40 text-xs font-semibold">
                  85%
                </Badge>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner">
                <div className="lesson-progress h-3 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
            
            <div className="p-5 education-card border border-secondary/30 hover:border-secondary/50 transition-all duration-300 group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-foreground geist group-hover:text-secondary transition-colors">Health Insurance</span>
                <Badge className="elite-badge bg-gradient-to-r from-secondary/30 to-secondary/20 text-secondary border-secondary/40 text-xs font-semibold">
                  65%
                </Badge>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-secondary via-secondary/90 to-secondary/80 h-3 rounded-full transition-all duration-500 relative overflow-hidden" style={{ width: "65%" }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="p-5 education-card border border-accent/30 hover:border-accent/50 transition-all duration-300 group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-foreground geist group-hover:text-accent transition-colors">OASDI & Medicare</span>
                <Badge className="elite-badge bg-gradient-to-r from-accent/30 to-accent/20 text-accent border-accent/40 text-xs font-semibold">
                  40%
                </Badge>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-accent via-accent/90 to-accent/80 h-3 rounded-full transition-all duration-500 relative overflow-hidden" style={{ width: "40%" }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
