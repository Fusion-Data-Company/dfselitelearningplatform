import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Bell, Settings, ChevronDown, Search, User, LogOut, BookOpen, Trophy } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  // Mock notifications - in real app, these would come from API
  const notifications = [
    { id: 1, title: "New lesson available", message: "HMO Balance Billing lesson is ready", time: "2h ago", unread: true },
    { id: 2, title: "Quiz completed", message: "You scored 85% on Practice Quiz", time: "1d ago", unread: false },
    { id: 3, title: "CE credits earned", message: "You've earned 2.5 CE hours this week", time: "2d ago", unread: true }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement actual search functionality
      console.log("Searching for:", searchQuery);
      // In real app: navigate to search results or filter content
      setShowSearch(false);
    }
  };

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

          {/* Functional Center Section */}
          <div className="flex items-center space-x-6">
            
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">12 lessons</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-secondary/10 rounded-lg">
                <Trophy className="w-4 h-4 text-secondary" />
                <span className="text-secondary font-medium">85% avg</span>
              </div>
            </div>

          </div>

          {/* Right Section - Real Functional Elements */}
          <div className="flex items-center space-x-3">
            
            {/* Search Functionality */}
            <div className="relative">
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search lessons, quizzes..."
                    className="w-64 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    onBlur={() => {
                      setTimeout(() => setShowSearch(false), 150);
                    }}
                  />
                </form>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSearch(true)}
                  className="hidden md:flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm text-gray-500">Search...</span>
                </Button>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {notifications.filter(n => n.unread).length}
              </div>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                          </div>
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center">
                    <Button variant="ghost" size="sm" className="text-primary">View all notifications</Button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              >
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

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50">
                  <div className="p-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Preferences
                    </Button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => window.location.href = '/api/logout'}
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {(showNotifications || showProfileMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
          }}
        />
      )}
    </nav>
  );
}
