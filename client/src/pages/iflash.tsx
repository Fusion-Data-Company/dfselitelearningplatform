import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import FlashCard from "@/components/FlashCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Layers3, 
  Flame, 
  Target, 
  TrendingUp, 
  Play, 
  RotateCcw,
  BookOpen
} from "lucide-react";

interface Flashcard {
  id: string;
  type: string;
  front?: string;
  back?: string;
  prompt?: string;
  options?: string[];
  answerIndex?: number;
  rationale?: string;
  sourceId?: string;
  difficulty: number;
  interval: number;
  reviewCount: number;
  nextReview: string;
}

interface StudyStats {
  totalCards: number;
  dueToday: number;
  reviewStreak: number;
  accuracy: number;
  timeToday: number;
}

export default function IFlashPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: flashcards = [], isLoading: cardsLoading } = useQuery<Flashcard[]>({
    queryKey: ['/api/iflash/cards'],
  });

  // Placeholder flashcards for demonstration when no real cards are loaded
  const placeholderCards: Flashcard[] = [
    {
      id: 'demo-1',
      type: 'basic',
      front: 'What does HMO stand for?',
      back: 'Health Maintenance Organization - A type of managed care plan that provides healthcare services through a network of doctors and hospitals.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-2', 
      type: 'basic',
      front: 'What is the primary purpose of Florida DFS regulation?',
      back: 'To protect consumers by ensuring insurance companies operate fairly, maintain adequate reserves, and comply with state insurance laws.',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-3',
      type: 'multiple_choice',
      prompt: 'Which of the following is NOT a type of managed care organization?',
      options: ['HMO', 'PPO', 'EPO', 'FFS'],
      answerIndex: 3,
      rationale: 'FFS (Fee-For-Service) is a traditional payment model, not a managed care organization. HMO, PPO, and EPO are all types of managed care.',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-4',
      type: 'basic',
      front: 'What does PPO stand for and what is its main characteristic?',
      back: 'Preferred Provider Organization - Allows members to see out-of-network providers but at higher cost, offering more flexibility than HMOs.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-5',
      type: 'basic',
      front: 'What is HIPAA and why is it important in healthcare?',
      back: 'Health Insurance Portability and Accountability Act - Protects patient privacy and ensures confidentiality of medical information.',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-6',
      type: 'multiple_choice',
      prompt: 'What is the minimum continuing education requirement for Florida insurance agents?',
      options: ['20 hours every 2 years', '24 hours every 2 years', '30 hours every 2 years', '40 hours every 2 years'],
      answerIndex: 1,
      rationale: '24 hours every 2 years is the standard CE requirement, including specific ethics and law components.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-7',
      type: 'basic',
      front: 'What is the difference between Medicare Part A and Part B?',
      back: 'Part A covers hospital insurance (inpatient care), while Part B covers medical insurance (outpatient care, doctor visits, preventive services).',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-8',
      type: 'basic',
      front: 'What does "grandfathered plan" mean under the ACA?',
      back: 'Health plans that existed before March 23, 2010, and have maintained certain characteristics, exempt from some ACA requirements.',
      difficulty: 3,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-9',
      type: 'multiple_choice',
      prompt: 'Which entity regulates insurance in Florida?',
      options: ['Florida Department of Health', 'Florida Department of Financial Services', 'Florida Insurance Commission', 'Florida Department of Commerce'],
      answerIndex: 1,
      rationale: 'The Florida Department of Financial Services (DFS) regulates insurance companies and agents in Florida.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-10',
      type: 'basic',
      front: 'What is an Essential Health Benefit under the ACA?',
      back: 'Required coverage categories including ambulatory care, emergency services, hospitalization, maternity care, mental health, prescription drugs, preventive care, pediatric services, rehabilitation, and laboratory services.',
      difficulty: 3,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    }
  ];

  // Use real flashcards if available, otherwise use placeholders
  const activeCards = flashcards.length > 0 ? flashcards : placeholderCards;

  // Auto-start session when cards are loaded (for immediate testing)
  useEffect(() => {
    if (activeCards.length > 0 && !sessionActive && currentCardIndex === 0 && reviewedCount === 0) {
      console.log('Auto-starting session with', activeCards.length, 'cards');
      setSessionActive(true);
    }
  }, [activeCards.length, sessionActive, currentCardIndex, reviewedCount]);

  const shouldAutoStart = activeCards.length > 0 && !sessionActive && currentCardIndex === 0;

  const { data: stats, isLoading: statsLoading } = useQuery<StudyStats>({
    queryKey: ['/api/iflash/stats'],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, grade }: { cardId: string; grade: number }) => {
      await apiRequest("POST", `/api/iflash/review/${cardId}`, { grade });
    },
    onSuccess: () => {
      setReviewedCount(prev => prev + 1);
      
      if (currentCardIndex < activeCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        // Session complete
        setSessionActive(false);
        setCurrentCardIndex(0);
        setReviewedCount(0);
        toast({
          title: "Review Session Complete!",
          description: `You reviewed ${activeCards.length} cards. Great work!`,
        });
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/iflash/cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/iflash/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record review",
        variant: "destructive",
      });
    },
  });

  const handleReview = (grade: number) => {
    const currentCard = activeCards[currentCardIndex];
    if (currentCard) {
      reviewMutation.mutate({ cardId: currentCard.id, grade });
    }
  };

  const handleStartSession = () => {
    setSessionActive(true);
    setCurrentCardIndex(0);
    setReviewedCount(0);
  };

  const handleResetSession = () => {
    setSessionActive(false);
    setCurrentCardIndex(0);
    setReviewedCount(0);
  };

  if (cardsLoading || statsLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hexagonal Glowing Background */}
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(/iflash-bg.jpg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        />
        
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen relative z-10">
          <div className="p-8">
            <div className="max-w-5xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-32 bg-muted rounded-2xl"></div>
                <div className="h-96 bg-muted rounded-2xl"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!activeCards.length && !sessionActive) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hexagonal Glowing Background */}
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(/iflash-bg.jpg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        />
        
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen relative z-10">
          <div className="p-8">
            <div className="max-w-5xl mx-auto text-center">
              <div className="mb-8">
                <Layers3 className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
                <h2 className="cinzel text-3xl font-bold mb-2">No Flashcards Available</h2>
                <p className="text-muted-foreground">
                  Generate activeCards from lesson content to start your spaced repetition learning.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.href = '/lesson/hmo-balance-billing'}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Go to Lessons
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hexagonal Glowing Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: `url(/iflash-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <Navigation />
      <Sidebar />
      
      <main className="ml-96 pt-16 min-h-screen relative z-10">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            
            {(!sessionActive && !shouldAutoStart) ? (
              // Study Session Overview
              <>
                <div className="glassmorphism-card rounded-2xl p-8 mb-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-2/80 flex items-center justify-center">
                      <Layers3 className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h1 className="cinzel text-4xl font-bold text-shimmer mb-2">
                        iFlash Learning System
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        Adaptive flashcard review • {stats?.dueToday || 0} cards due today
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-chart-2" />
                      <span>Adaptive Learning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-chart-2" />
                      <span>Progress Tracking</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-chart-2" />
                      <span>Streak Building</span>
                    </div>
                  </div>
                </div>

                {/* Study Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <Card className="glassmorphism border-border text-center">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="w-6 h-6 text-primary mr-2" />
                      </div>
                      <p className="text-2xl font-bold text-primary">{stats?.dueToday || 0}</p>
                      <p className="text-sm text-muted-foreground">Due Today</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glassmorphism border-border text-center">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center mb-2">
                        <Layers3 className="w-6 h-6 text-secondary mr-2" />
                      </div>
                      <p className="text-2xl font-bold text-secondary">{stats?.totalCards || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Cards</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glassmorphism border-border text-center">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center mb-2">
                        <Flame className="w-6 h-6 text-accent mr-2" />
                      </div>
                      <p className="text-2xl font-bold text-accent">{stats?.reviewStreak || 0}</p>
                      <p className="text-sm text-muted-foreground">Study Streak</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glassmorphism border-border text-center">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="w-6 h-6 text-chart-4 mr-2" />
                      </div>
                      <p className="text-2xl font-bold text-chart-4">{stats?.accuracy || 0}%</p>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Start Session */}
                <Card className="glassmorphism border-border text-center">
                  <CardContent className="p-8">
                    <h3 className="cinzel text-xl font-bold mb-4">Ready to Review?</h3>
                    <p className="text-muted-foreground mb-6">
                      You have {activeCards.length} cards ready for review. 
                      Let's strengthen your knowledge with spaced repetition.
                    </p>
                    
                    <div className="space-y-4">
                      <Button
                        onClick={handleStartSession}
                        size="lg"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-start-review"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Review Session
                      </Button>
                      <Button
                        onClick={handleStartSession}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                        data-testid="button-quick-start"
                      >
                        Quick Start
                      </Button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="p-3 bg-card rounded-lg">
                          <p className="font-medium">Session Length</p>
                          <p className="text-muted-foreground">{activeCards.length} cards</p>
                        </div>
                        <div className="p-3 bg-card rounded-lg">
                          <p className="font-medium">Est. Time</p>
                          <p className="text-muted-foreground">{Math.ceil(activeCards.length * 0.5)} minutes</p>
                        </div>
                        <div className="p-3 bg-card rounded-lg">
                          <p className="font-medium">Algorithm</p>
                          <p className="text-muted-foreground">SM-2 SRS</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              // Active Review Session (including auto-started)
              <>
                {/* Session Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="cinzel text-2xl font-bold">Review Session</h2>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="font-semibold">{reviewedCount} / {activeCards.length}</p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(reviewedCount / activeCards.length) * 100} 
                    className="h-2 mb-2"
                  />
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      Card {currentCardIndex + 1} of {activeCards.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetSession}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="button-end-session"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                </div>

                {/* Current Flashcard */}
                {activeCards[currentCardIndex] && (
                  <FlashCard
                    card={activeCards[currentCardIndex]}
                    onReview={handleReview}
                    cardNumber={currentCardIndex + 1}
                    totalCards={activeCards.length}
                  />
                )}

                {/* Session Stats */}
                <Card className="glassmorphism border-border mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="cinzel font-bold">Session Progress</h3>
                      <span className="text-sm text-muted-foreground">
                        {reviewedCount} / {activeCards.length} completed
                      </span>
                    </div>
                    
                    <Progress 
                      value={(reviewedCount / activeCards.length) * 100} 
                      className="h-3 mb-4"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{reviewedCount}</p>
                        <p className="text-xs text-muted-foreground">Reviewed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-secondary">{activeCards.length - reviewedCount}</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
