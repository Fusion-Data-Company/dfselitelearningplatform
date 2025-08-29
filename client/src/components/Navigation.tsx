import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Bell } from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism-card border-b border-border/30 backdrop-blur-[32px]">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-lg animate-elite-glow">
            <GraduationCap className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="cinzel text-2xl font-bold text-shimmer">DFS-215 Elite</h1>
            <p className="text-sm text-muted-foreground geist font-medium tracking-wide">Premium Learning Platform</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-5">
          <Button 
            variant="ghost" 
            size="icon"
            className="elite-interactive p-3 rounded-2xl bg-gradient-to-br from-card/80 to-muted/60 hover:from-accent/20 hover:to-accent/10 border border-border/50 hover:border-accent/50 transition-all duration-300"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5 text-accent animate-pulse" />
          </Button>
          
          <div className="flex items-center space-x-3 px-4 py-3 glassmorphism-card rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg animate-elite-glow">
              <span className="text-sm font-bold text-white drop-shadow-lg">
                {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
              </span>
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground geist" data-testid="text-username">
                {user?.firstName || "Student"}
              </span>
              <p className="text-xs text-muted-foreground">Elite Member</p>
            </div>
          </div>
          
          <Button 
            variant="ghost"
            onClick={() => window.location.href = '/api/logout'}
            className="elite-interactive px-4 py-2 text-muted-foreground hover:text-foreground bg-gradient-to-br from-card/60 to-muted/40 hover:from-destructive/20 hover:to-destructive/10 rounded-xl border border-border/50 hover:border-destructive/50 transition-all duration-300 geist font-medium"
            data-testid="button-logout"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
