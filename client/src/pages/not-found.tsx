import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Home, 
  BookOpen, 
  Brain, 
  HelpCircle, 
  Clock, 
  Layers3, 
  Award, 
  Settings,
  Search,
  ChevronRight,
  TrendingUp
} from "lucide-react";

export default function NotFound() {
  const navigationItems = [
    { href: "/", icon: Home, label: "Dashboard", description: "Your learning hub with progress analytics" },
    { href: "/lesson/hmo-balance-billing", icon: BookOpen, label: "Lesson Player", description: "Interactive course content and materials" },
    { href: "/quiz", icon: HelpCircle, label: "Practice Quiz", description: "Test your knowledge with practice questions" },
    { href: "/exam", icon: Clock, label: "Timed Exam", description: "Proctored certification exam simulation" },
    { href: "/iflash", icon: Layers3, label: "iFlash Review", description: "Spaced repetition flashcard system" },
    { href: "/agents", icon: Brain, label: "AI Agents", description: "CoachBot, StudyBuddy, and ProctorBot" },
    { href: "/ce-tracking", icon: Award, label: "CE Tracking", description: "Continuing education compliance monitoring" },
    { href: "/admin", icon: Settings, label: "Admin Panel", description: "Platform management and analytics" },
  ];

  const popularResources = [
    { title: "HMO Balance Billing", type: "Lesson", difficulty: "Intermediate" },
    { title: "Life Insurance Fundamentals", type: "Lesson", difficulty: "Beginner" },
    { title: "Florida DFS Regulations", type: "Quiz", difficulty: "Advanced" },
    { title: "Disability Income Practice", type: "iFlash", difficulty: "Intermediate" },
  ];

  return (
    <div className="min-h-screen education-bg">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism-card border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="cinzel text-xl font-bold text-foreground">DFS-215 Elite</h1>
              <p className="text-xs text-muted-foreground">Learning Platform</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            data-testid="button-home"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </nav>

      <main className="pt-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Error Section */}
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mx-auto mb-8 animate-bounce">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="cinzel text-5xl font-bold text-foreground mb-4">404 - Page Not Found</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The page you're looking for doesn't exist or has been moved. But don't worry - let's get you back on track with your learning journey.
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/'}
                className="px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
                data-testid="button-dashboard"
              >
                <Home className="w-5 h-5 mr-2" />
                Return to Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/lesson/hmo-balance-billing'}
                className="px-8 py-4 border-border hover:bg-muted/50 transition-colors"
                data-testid="button-continue-learning"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Continue Learning
              </Button>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="mb-16">
            <h2 className="cinzel text-3xl font-bold text-center mb-8">Explore Platform Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card 
                    key={item.href}
                    className="education-card cursor-pointer group hover:scale-105 transition-all duration-300 border-primary/20 hover:border-primary/40"
                    onClick={() => window.location.href = item.href}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors">{item.label}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Popular Resources */}
          <div className="mb-16">
            <h2 className="cinzel text-3xl font-bold text-center mb-8">Popular Learning Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularResources.map((resource, index) => (
                <Card key={index} className="education-card group hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent to-chart-2 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {resource.type === 'Lesson' && <BookOpen className="w-5 h-5 text-white" />}
                        {resource.type === 'Quiz' && <HelpCircle className="w-5 h-5 text-white" />}
                        {resource.type === 'iFlash' && <Layers3 className="w-5 h-5 text-white" />}
                      </div>
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                        {resource.type}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-sm mb-2">{resource.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{resource.difficulty}</span>
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center pb-16">
            <Card className="glassmorphism border-border max-w-2xl mx-auto">
              <CardContent className="p-8">
                <Search className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                <h2 className="cinzel text-2xl font-bold mb-4">Still Can't Find What You're Looking For?</h2>
                <p className="text-muted-foreground mb-6">
                  Try searching for specific topics, or get help from our AI assistants who can guide you to the right content.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/agents'}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
                    data-testid="button-ai-help"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Ask AI Tutors
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/admin'}
                    className="border-border hover:bg-muted/50"
                    data-testid="button-support"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Get Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
