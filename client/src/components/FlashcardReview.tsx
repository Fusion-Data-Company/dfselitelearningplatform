import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  RotateCcw, 
  Brain, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Timer
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: number;
  interval: number;
  reviewCount: number;
  lastReviewed: string | null;
  nextReview: string;
}

interface FlashcardReviewProps {
  cards: Flashcard[];
  onComplete: () => void;
}

interface ReviewResponse {
  quality: number; // 0-3 (Again, Hard, Good, Easy)
}

export default function FlashcardReview({ cards, onComplete }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    totalTime: 0
  });
  const [startTime, setStartTime] = useState<number>(Date.now());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;
  const progress = ((currentIndex + (showBack ? 1 : 0)) / cards.length) * 100;

  const reviewMutation = useMutation({
    mutationFn: async (response: ReviewResponse & { cardId: string }) => {
      await apiRequest("POST", `/api/flashcards/${response.cardId}/review`, {
        quality: response.quality,
        timeSpent: Date.now() - startTime
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards'] });
    },
    onError: (error) => {
      toast({
        title: "Review Error",
        description: error instanceof Error ? error.message : "Failed to save review",
        variant: "destructive",
      });
    },
  });

  const handleReveal = () => {
    setShowBack(true);
  };

  const handleResponse = (quality: number) => {
    if (!currentCard) return;

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: quality >= 2 ? prev.correct + 1 : prev.correct,
      totalTime: prev.totalTime + (Date.now() - startTime)
    }));

    // Submit review
    reviewMutation.mutate({
      cardId: currentCard.id,
      quality
    });

    // Move to next card or complete
    if (isLastCard) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowBack(false);
      setStartTime(Date.now());
    }
  };

  const getResponseConfig = () => [
    {
      quality: 0,
      label: "Again",
      icon: "😰",
      description: "< 1m",
      color: "border-destructive/30 hover:bg-destructive/10 text-destructive",
      bgGradient: "from-destructive/10 to-destructive/5"
    },
    {
      quality: 1,
      label: "Hard",
      icon: "🤔",
      description: "6m",
      color: "border-orange-500/30 hover:bg-orange-500/10 text-orange-600",
      bgGradient: "from-orange-500/10 to-orange-500/5"
    },
    {
      quality: 2,
      label: "Good",
      icon: "😊",
      description: "1d",
      color: "border-blue-500/30 hover:bg-blue-500/10 text-blue-600",
      bgGradient: "from-blue-500/10 to-blue-500/5"
    },
    {
      quality: 3,
      label: "Easy",
      icon: "🚀",
      description: "4d",
      color: "border-green-500/30 hover:bg-green-500/10 text-green-600",
      bgGradient: "from-green-500/10 to-green-500/5"
    }
  ];

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h3 className="cinzel text-2xl font-bold mb-2">Review Complete!</h3>
        <p className="text-muted-foreground">All flashcards have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="glassmorphism-card rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">iFlash Review Session</h3>
            <p className="text-muted-foreground">Card {currentIndex + 1} of {cards.length}</p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-chart-2" />
              <span>{sessionStats.reviewed}/{cards.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>{sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-secondary" />
              <span>{Math.round(sessionStats.totalTime / sessionStats.reviewed / 1000) || 0}s avg</span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="perspective-1000">
        <Card className={`education-card min-h-[400px] transition-all duration-500 ${showBack ? 'rotate-y-180' : ''} relative overflow-hidden group`}>
          <CardContent className="p-8 h-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {!showBack ? (
              /* Front of card */
              <div className="text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-4 flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h4 className="cinzel text-2xl font-bold mb-6 text-foreground leading-relaxed">
                  {currentCard.front}
                </h4>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Think about your answer, then click below to reveal the correct response.
                </p>
                <Button onClick={handleReveal} className="floating-action px-8 py-3">
                  <Brain className="w-5 h-5 mr-2" />
                  Reveal Answer
                </Button>
              </div>
            ) : (
              /* Back of card */
              <div className="text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h4 className="cinzel text-xl font-bold mb-4 text-primary">Answer:</h4>
                <div className="text-lg text-foreground mb-8 leading-relaxed max-w-lg mx-auto">
                  {currentCard.back}
                </div>
                <p className="text-muted-foreground mb-6">
                  How well did you know this answer?
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Buttons */}
      {showBack && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getResponseConfig().map((config) => (
            <Button
              key={config.quality}
              variant="outline"
              onClick={() => handleResponse(config.quality)}
              disabled={reviewMutation.isPending}
              className={`p-4 h-auto transition-all duration-300 ${config.color}`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{config.icon}</div>
                <div className="text-sm font-medium">{config.label}</div>
                <div className="text-xs text-muted-foreground">{config.description}</div>
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setCurrentIndex(prev => Math.max(0, prev - 1));
            setShowBack(false);
          }}
          disabled={currentIndex === 0}
          className="border-muted-foreground/30"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Badge variant="outline" className="px-4 py-2">
          Difficulty: {currentCard.difficulty.toFixed(1)}
        </Badge>
        
        <Button 
          variant="outline"
          onClick={() => {
            if (isLastCard) {
              onComplete();
            } else {
              setCurrentIndex(prev => prev + 1);
              setShowBack(false);
            }
          }}
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          {isLastCard ? 'Complete' : 'Skip'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}