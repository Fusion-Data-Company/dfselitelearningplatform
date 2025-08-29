import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Shield, Trophy } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-border">
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
            onClick={() => window.location.href = '/api/login'}
            className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center animate-float">
                <BookOpen className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="cinzel text-5xl md:text-6xl font-bold text-foreground mb-6 animate-fadeIn">
                DFS-215 Elite Learning
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Master Florida insurance law with AI-powered coaching, adaptive learning, and comprehensive exam preparation for your DFS-215 certification.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                className="px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-4 border-border hover:bg-muted/50 transition-colors"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <Card className="glow-card glassmorphism border-border group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="cinzel text-lg font-semibold mb-2">AI Coaching</h3>
                <p className="text-sm text-muted-foreground">
                  Personal AI tutors guide your learning with CoachBot, StudyBuddy, and ProctorBot
                </p>
              </CardContent>
            </Card>

            <Card className="glow-card glassmorphism border-border group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                  <Trophy className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="cinzel text-lg font-semibold mb-2">Adaptive Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Spaced repetition flashcards and personalized study plans optimize retention
                </p>
              </CardContent>
            </Card>

            <Card className="glow-card glassmorphism border-border group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h3 className="cinzel text-lg font-semibold mb-2">Exam Preparation</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive practice tests with proctored exam simulation
                </p>
              </CardContent>
            </Card>

            <Card className="glow-card glassmorphism border-border group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-chart-4/20 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-chart-4/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-chart-4" />
                </div>
                <h3 className="cinzel text-lg font-semibold mb-2">CE Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic continuing education hour tracking with certificate generation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Curriculum Overview */}
          <div className="text-center mb-20">
            <h2 className="cinzel text-3xl font-bold mb-8">Complete DFS-215 Curriculum</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                "Law & Ethics (4-Hr CE)",
                "Health Insurance & Managed Care", 
                "Social Insurance (OASDI)",
                "Disability Income Insurance",
                "Life Insurance & Riders",
                "Annuities & Variable Products",
                "FIGA/DFS/CFO"
              ].map((topic, index) => (
                <div 
                  key={index}
                  className="p-4 bg-card/50 rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <span className="text-sm font-medium">{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pb-20">
            <Card className="glassmorphism border-border max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="cinzel text-2xl font-bold mb-4">Ready to Excel?</h2>
                <p className="text-muted-foreground mb-6">
                  Join thousands of successful insurance professionals who've mastered their DFS-215 certification with our elite platform.
                </p>
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/api/login'}
                  className="px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                  data-testid="button-start-learning"
                >
                  Start Learning Today
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
