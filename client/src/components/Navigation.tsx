import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Bell, Settings, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const navItems = [
    { href: "/", label: "Dashboard", active: location === "/" },
    { href: "/iflash", label: "iFlash", active: location === "/iflash" },
    { href: "/agents", label: "AI Tutors", active: location === "/agents" },
    { href: "/ce-tracking", label: "CE Tracking", active: location === "/ce-tracking" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">DFS-215</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Learning Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  item.active 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-medium">
                {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-username">
                  {user?.firstName || "Student"}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {/* Sign Out */}
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
