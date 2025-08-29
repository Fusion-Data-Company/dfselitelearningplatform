import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  BookOpen, 
  HelpCircle, 
  Clock, 
  Layers3, 
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
    { href: "/admin", icon: Settings, label: "Admin Panel", color: "text-chart-4" },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 glassmorphism-card border-r border-border/50 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Menu */}
        <div className="space-y-2">
          <h3 className="cinzel text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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
                    className={`sidebar-nav w-full justify-start h-auto p-3 ${
                      isActive ? 'bg-primary/10 text-primary' : ''
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-primary' : item.color}`} />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Course Progress */}
        <div className="space-y-2">
          <h3 className="cinzel text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Course Progress
          </h3>
          <div className="space-y-3">
            <div className="p-4 education-card border border-primary/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-foreground">Law & Ethics</span>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  85%
                </Badge>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2.5 relative overflow-hidden">
                <div className="premium-gradient h-2.5 rounded-full transition-all duration-500" style={{ width: "85%" }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 education-card border border-secondary/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-foreground">Health Insurance</span>
                <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                  65%
                </Badge>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2.5 relative overflow-hidden">
                <div className="bg-gradient-to-r from-secondary to-secondary/80 h-2.5 rounded-full transition-all duration-500" style={{ width: "65%" }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 education-card border border-accent/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-foreground">OASDI & Medicare</span>
                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                  40%
                </Badge>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2.5 relative overflow-hidden">
                <div className="bg-gradient-to-r from-accent to-accent/80 h-2.5 rounded-full transition-all duration-500" style={{ width: "40%" }}>
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
