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
    <aside className="fixed left-0 top-16 bottom-0 w-64 glassmorphism border-r border-border p-6 overflow-y-auto">
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
            <div className="p-3 bg-card rounded-xl border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Law & Ethics</span>
                <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                  85%
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="lesson-progress h-2 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            
            <div className="p-3 bg-card rounded-xl border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Health Insurance</span>
                <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs">
                  65%
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
            
            <div className="p-3 bg-card rounded-xl border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">OASDI & Medicare</span>
                <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                  40%
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
