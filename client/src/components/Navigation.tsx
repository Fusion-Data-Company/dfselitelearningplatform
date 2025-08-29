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
    <nav className="fixed top-0 left-0 right-0 z-50 ultra-glass border-b border-border/30 particle-field micro-shimmer">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 morphing-bg rounded-2xl flex items-center justify-center shadow-lg animate-divine micro-bounce">
            <GraduationCap className="w-7 h-7 text-white drop-shadow-lg animate-quantum" />
          </div>
          <div>
            <h1 className="cinzel text-2xl font-bold holographic-text" data-text="DFS-215 Elite">DFS-215 Elite</h1>
            <p className="text-sm text-muted-foreground geist font-medium tracking-wide animate-particle">Premium Learning Platform</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-5">
          <Button 
            variant="ghost" 
            size="icon"
            className="ultra-glass p-3 rounded-2xl micro-glow micro-tilt animate-cosmic"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5 text-accent animate-quantum" />
          </Button>
          
          <div className="flex items-center space-x-3 px-4 py-3 ultra-glass rounded-2xl micro-glow">
            <div className="w-10 h-10 morphing-bg rounded-xl flex items-center justify-center shadow-lg animate-divine micro-bounce">
              <span className="text-sm font-bold text-white drop-shadow-lg holographic-text" data-text={getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}>
                {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
              </span>
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground geist animate-holographic" data-testid="text-username">
                {user?.firstName || "Student"}
              </span>
              <p className="text-xs text-muted-foreground micro-pulse">Elite Member</p>
            </div>
          </div>
          
          <Button 
            variant="ghost"
            onClick={() => window.location.href = '/api/logout'}
            className="divine-button px-6 py-3 text-white font-bold micro-tilt"
            data-testid="button-logout"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
