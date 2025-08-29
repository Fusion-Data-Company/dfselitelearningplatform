import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Brain, 
  Shield, 
  Trophy, 
  Star, 
  Users, 
  TrendingUp, 
  Clock, 
  Award, 
  CheckCircle, 
  Target, 
  Zap, 
  Quote
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen education-bg particle-field">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 ultra-glass border-b border-border/50 micro-shimmer">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 morphing-bg rounded-xl flex items-center justify-center animate-divine micro-bounce">
              <BookOpen className="w-6 h-6 text-primary-foreground animate-cosmic" />
            </div>
            <div>
              <h1 className="cinzel text-xl font-bold holographic-text" data-text="DFS-215 Elite">DFS-215 Elite</h1>
              <p className="text-xs text-muted-foreground animate-particle">Learning Platform</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="divine-button px-6 py-3 text-white font-bold micro-tilt"
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
              <div className="w-20 h-20 morphing-bg rounded-2xl mx-auto mb-6 flex items-center justify-center animate-divine micro-bounce">
                <BookOpen className="w-10 h-10 text-primary-foreground animate-cosmic" />
              </div>
              <h1 className="cinzel text-5xl md:text-6xl font-bold holographic-text mb-6 animate-fadeIn" data-text="DFS-215 Elite Learning">
                DFS-215 Elite Learning
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-particle">
                Master Florida insurance law with AI-powered coaching, adaptive learning, and comprehensive exam preparation for your DFS-215 certification.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                className="divine-button px-8 py-4 text-white font-bold micro-tilt"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="ultra-glass px-8 py-4 micro-glow micro-bounce"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <Card className="ultra-glass group micro-glow micro-tilt animate-quantum">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 morphing-bg rounded-xl mx-auto mb-4 flex items-center justify-center animate-divine micro-bounce">
                  <Brain className="w-7 h-7 text-white animate-cosmic" />
                </div>
                <h3 className="cinzel text-xl font-bold mb-3 holographic-text" data-text="AI Coaching">AI Coaching</h3>
                <p className="text-sm text-muted-foreground animate-particle">
                  Personal AI tutors guide your learning with CoachBot, StudyBuddy, and ProctorBot
                </p>
              </CardContent>
            </Card>

            <Card className="ultra-glass group micro-glow micro-tilt animate-cosmic">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 morphing-bg rounded-xl mx-auto mb-4 flex items-center justify-center animate-holographic micro-bounce">
                  <Trophy className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="cinzel text-lg font-semibold mb-2 holographic-text" data-text="Adaptive Learning">Adaptive Learning</h3>
                <p className="text-sm text-muted-foreground animate-particle">
                  Spaced repetition flashcards and personalized study plans optimize retention
                </p>
              </CardContent>
            </Card>

            <Card className="ultra-glass group micro-glow micro-tilt animate-divine">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 morphing-bg rounded-xl mx-auto mb-4 flex items-center justify-center animate-morphing micro-bounce">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h3 className="cinzel text-lg font-semibold mb-2 holographic-text" data-text="Exam Preparation">Exam Preparation</h3>
                <p className="text-sm text-muted-foreground animate-particle">
                  Comprehensive practice tests with proctored exam simulation
                </p>
              </CardContent>
            </Card>

            <Card className="ultra-glass group micro-glow micro-tilt animate-holographic">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 morphing-bg rounded-xl mx-auto mb-4 flex items-center justify-center animate-quantum micro-bounce">
                  <BookOpen className="w-6 h-6 text-chart-4" />
                </div>
                <h3 className="cinzel text-lg font-semibold mb-2 holographic-text" data-text="CE Tracking">CE Tracking</h3>
                <p className="text-sm text-muted-foreground animate-particle">
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

          {/* Success Statistics */}
          <div className="text-center mb-20">
            <h2 className="cinzel text-3xl font-bold mb-8">Platform Success Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">5,200+</div>
                <p className="text-sm text-muted-foreground">Students Certified</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-secondary mb-2">94%</div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-chart-2 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-accent mb-2">4.9/5</div>
                <p className="text-sm text-muted-foreground">Student Rating</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-chart-2 to-chart-4 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-chart-2 mb-2">24hrs</div>
                <p className="text-sm text-muted-foreground">Average Study Time</p>
              </div>
            </div>
          </div>

          {/* Student Testimonials */}
          <div className="mb-20">
            <h2 className="cinzel text-3xl font-bold text-center mb-8 holographic-text" data-text="Student Success Stories">Student Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="ultra-glass micro-glow micro-tilt animate-quantum">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 morphing-bg rounded-full flex items-center justify-center animate-divine micro-bounce">
                      <Quote className="w-6 h-6 text-white animate-cosmic" />
                    </div>
                    <div>
                      <h4 className="font-bold holographic-text" data-text="Sarah Martinez">Sarah Martinez</h4>
                      <p className="text-sm text-muted-foreground animate-particle">Insurance Agent, Miami</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500 animate-quantum" />)}
                  </div>
                  <p className="text-sm italic text-muted-foreground">
                    "The AI tutors made complex insurance concepts easy to understand. I passed my DFS-215 on the first try with a 92% score!"
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
                      <Quote className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold">Michael Chen</h4>
                      <p className="text-sm text-muted-foreground">Agency Owner, Tampa</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
                  </div>
                  <p className="text-sm italic text-muted-foreground">
                    "The spaced repetition system helped me retain everything. Best investment I made for my insurance career."
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-chart-2 rounded-full flex items-center justify-center">
                      <Quote className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold">Jennifer Lopez</h4>
                      <p className="text-sm text-muted-foreground">Insurance Broker, Orlando</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
                  </div>
                  <p className="text-sm italic text-muted-foreground">
                    "ProctorBot's exam simulation was exactly like the real test. I felt completely prepared and confident."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Learning Path Overview */}
          <div className="mb-20">
            <h2 className="cinzel text-3xl font-bold text-center mb-8">Your Learning Journey</h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mx-auto mb-4 flex items-center justify-center relative">
                    <Target className="w-8 h-8 text-white" />
                    <Badge className="absolute -top-2 -right-2 bg-primary text-xs px-1">1</Badge>
                  </div>
                  <h3 className="font-bold mb-2">Assessment</h3>
                  <p className="text-sm text-muted-foreground">AI evaluates your knowledge and creates a personalized study plan</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl mx-auto mb-4 flex items-center justify-center relative">
                    <BookOpen className="w-8 h-8 text-white" />
                    <Badge className="absolute -top-2 -right-2 bg-secondary text-xs px-1">2</Badge>
                  </div>
                  <h3 className="font-bold mb-2">Learning</h3>
                  <p className="text-sm text-muted-foreground">Interactive lessons with AI tutors guide you through each concept</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl mx-auto mb-4 flex items-center justify-center relative">
                    <Zap className="w-8 h-8 text-white" />
                    <Badge className="absolute -top-2 -right-2 bg-accent text-xs px-1">3</Badge>
                  </div>
                  <h3 className="font-bold mb-2">Practice</h3>
                  <p className="text-sm text-muted-foreground">Spaced repetition and practice tests reinforce your knowledge</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-chart-2 to-chart-2/80 rounded-2xl mx-auto mb-4 flex items-center justify-center relative">
                    <Award className="w-8 h-8 text-white" />
                    <Badge className="absolute -top-2 -right-2 bg-chart-2 text-xs px-1">4</Badge>
                  </div>
                  <h3 className="font-bold mb-2">Certification</h3>
                  <p className="text-sm text-muted-foreground">Pass your DFS-215 exam with confidence and earn your certification</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Benefits */}
          <div className="mb-20">
            <h2 className="cinzel text-3xl font-bold text-center mb-8">Why Choose DFS-215 Elite?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="glassmorphism border-border hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <CheckCircle className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-bold mb-3">Florida DFS Approved</h3>
                  <p className="text-sm text-muted-foreground">
                    Fully compliant with Florida Department of Financial Services requirements and regulations.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-border hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <Brain className="w-12 h-12 text-secondary mb-4" />
                  <h3 className="font-bold mb-3">AI-Powered Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    Three specialized AI tutors adapt to your learning style and provide personalized guidance.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-border hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <Clock className="w-12 h-12 text-accent mb-4" />
                  <h3 className="font-bold mb-3">Self-Paced Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    Study at your own pace with 24/7 access to all course materials and AI assistants.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-border hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <Shield className="w-12 h-12 text-chart-2 mb-4" />
                  <h3 className="font-bold mb-3">Exam Simulation</h3>
                  <p className="text-sm text-muted-foreground">
                    ProctorBot provides realistic exam conditions with comprehensive performance analytics.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-border hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <Award className="w-12 h-12 text-chart-4 mb-4" />
                  <h3 className="font-bold mb-3">CE Hour Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic tracking of continuing education hours with certificate generation.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glassmorphism border-border hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <TrendingUp className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-bold mb-3">Progress Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed insights into your learning progress with performance recommendations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pb-20">
            <Card className="ultra-glass max-w-3xl mx-auto micro-glow animate-divine">
              <CardContent className="p-8">
                <Trophy className="w-16 h-16 mx-auto mb-6 text-primary animate-cosmic micro-bounce" />
                <h2 className="cinzel text-3xl font-bold mb-4 holographic-text" data-text="Ready to Excel in Your Insurance Career?">Ready to Excel in Your Insurance Career?</h2>
                <p className="text-lg text-muted-foreground mb-6 animate-particle">
                  Join thousands of successful insurance professionals who've mastered their DFS-215 certification with our elite platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    onClick={() => window.location.href = '/api/login'}
                    className="divine-button px-8 py-4 text-white font-bold micro-tilt"
                    data-testid="button-start-learning"
                  >
                    Start Learning Today
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="ultra-glass px-8 py-4 micro-glow micro-bounce"
                    data-testid="button-view-demo"
                  >
                    View Demo
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4 animate-particle">
                  No credit card required • 94% pass rate • Florida DFS approved
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
