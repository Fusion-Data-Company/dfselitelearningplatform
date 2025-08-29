import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, RotateCcw } from "lucide-react";

interface FlashCardProps {
  card: {
    id: string;
    type: string;
    front: string;
    back: string;
    sourceId?: string;
    difficulty: number;
    interval: number;
    reviewCount: number;
  };
  onReview: (grade: number) => void;
  cardNumber: number;
  totalCards: number;
}

export default function FlashCard({ card, onReview, cardNumber, totalCards }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGrade = (grade: number) => {
    onReview(grade);
    setIsFlipped(false);
  };

  const getGradeInfo = (grade: number) => {
    switch (grade) {
      case 0:
        return { label: "Again", time: "< 1 min", color: "destructive" };
      case 1:
        return { label: "Hard", time: "+1 day", color: "accent" };
      case 2:
        return { label: "Good", time: `+${Math.round(card.interval * card.difficulty)} days`, color: "secondary" };
      case 3:
        return { label: "Easy", time: `+${Math.round(card.interval * card.difficulty * 1.3)} days`, color: "primary" };
      default:
        return { label: "Good", time: "+6 days", color: "secondary" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Card Info */}
      <div className="text-center">
        <h2 className="cinzel text-3xl font-bold mb-2 transcendent-text">iFlash Review Session</h2>
        <p className="text-muted-foreground">
          Card {cardNumber} of {totalCards} • 
          {card.reviewCount === 0 ? ' New card' : ` Reviewed ${card.reviewCount} times`}
        </p>
      </div>

      {/* Flashcard */}
      <Card 
        className={`glassmorphism border-border cursor-pointer flashcard hyper-interactive premium-hover quantum-distort ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        data-testid="flashcard"
      >
        <CardContent className="p-8 h-64 relative">
          <div className="flashcard-inner relative w-full h-full">
            {/* Front of card */}
            <div className="flashcard-front absolute inset-0 flex items-center justify-center text-center">
              <div>
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2">
                    {card.type.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="cinzel text-xl font-bold mb-4 transcendent-text">{card.front}</h3>
                {!isFlipped && (
                  <p className="text-sm text-muted-foreground">Click to reveal answer</p>
                )}
              </div>
            </div>
            
            {/* Back of card */}
            <div className="flashcard-back absolute inset-0 flex items-center justify-center text-center">
              <div>
                <h3 className="cinzel text-xl font-bold mb-4 transcendent-text">{card.back}</h3>
                {card.sourceId && (
                  <div className="inline-flex items-center space-x-2 text-xs bg-card px-3 py-2 rounded-lg">
                    <Book className="w-3 h-3 text-secondary" />
                    <span>Source: Lesson Content</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground glassmorphism p-4 rounded-xl holographic-interface">
        <div>
          <p>Ease Factor: {card.difficulty.toFixed(1)}</p>
          <p>Current Interval: {card.interval} days</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFlip}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-flip-card"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Flip Card
        </Button>
      </div>

      {/* Response Buttons - Only show when flipped */}
      {isFlipped && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((grade) => {
            const info = getGradeInfo(grade);
            return (
              <Button
                key={grade}
                onClick={() => handleGrade(grade)}
                className={`p-4 h-auto bg-${info.color}/20 text-${info.color} border-${info.color}/50 hover:bg-${info.color}/30`}
                variant="outline"
                data-testid={`button-grade-${grade}`}
              >
                <div className="text-center">
                  <p className="font-semibold">{info.label}</p>
                  <p className="text-xs opacity-75">{info.time}</p>
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
