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

  const functionalTabs = [
    { href: "/", label: "Learning", active: location === "/" || location.startsWith("/lesson") },
    { href: "/quiz", label: "Practice", active: location.startsWith("/quiz") || location === "/iflash" },
    { href: "/agents", label: "Tutoring", active: location === "/agents" },
    { href: "/ce-tracking", label: "Progress", active: location === "/ce-tracking" },
    { href: "/admin", label: "Resources", active: location.startsWith("/admin") }
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

          {/* Functional Navigation Tabs */}
          <div className="flex items-center">
            {functionalTabs.map((tab) => (
              <Link key={tab.href} href={tab.href}>
                <span className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
                  tab.active 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-gray-700'
                }`}>
                  {tab.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Section - Functional Elements */}
          <div className="flex items-center space-x-4">
            
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden md:flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-500">Search...</span>
            </Button>

            {/* Notifications with Badge */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </div>
            </div>

            {/* User Profile with Status */}
            <div className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
              <div className="relative">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-username">
                  {user?.firstName || "Student"}
                </div>
                <div className="text-xs text-gray-500">Online</div>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>

            {/* Settings Dropdown */}
            <Button 
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
