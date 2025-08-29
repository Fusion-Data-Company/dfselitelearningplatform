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
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="cinzel text-xl font-bold text-foreground">DFS-215 Elite</h1>
            <p className="text-xs text-muted-foreground">Learning Platform</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="p-2 rounded-xl bg-muted hover:bg-accent/20 transition-colors"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5 text-accent" />
          </Button>
          
          <div className="flex items-center space-x-2 px-3 py-2 bg-card rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">
                {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
              </span>
            </div>
            <span className="text-sm font-medium" data-testid="text-username">
              {user?.firstName || "Student"}
            </span>
          </div>
          
          <Button 
            variant="ghost"
            onClick={() => window.location.href = '/api/logout'}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
