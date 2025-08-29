import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, RotateCcw, CheckCircle, XCircle } from "lucide-react";

interface FlashCardProps {
  card: {
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
  };
  onReview: (grade: number) => void;
  cardNumber: number;
  totalCards: number;
}

export default function FlashCard({ card, onReview, cardNumber, totalCards }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleFlip = () => {
    if (card.type === 'mcq' && card.options && !selectedOption !== null) {
      return; // Don't flip MCQ until option is selected
    }
    setIsFlipped(!isFlipped);
  };

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setIsFlipped(true); // Auto-flip on option selection for MCQ
  };

  const handleGrade = (grade: number) => {
    onReview(grade);
    setIsFlipped(false);
    setSelectedOption(null);
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

  // MCQ Renderer
  const renderMCQCard = () => {
    if (!card.options || !card.prompt) {
      // Fallback to legacy format
      return renderLegacyCard();
    }

    return (
      <Card 
        className="glassmorphism border-border"
        data-testid="flashcard"
      >
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Question */}
            <div className="text-center">
              <Badge variant="outline" className="mb-4">
                {card.type.toUpperCase()}
              </Badge>
              <h3 className="cinzel text-xl font-bold mb-6">{card.prompt}</h3>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {card.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = card.answerIndex === index;
                const showResult = isFlipped;
                
                let buttonClass = "w-full text-left p-4 transition-all duration-200 ";
                
                if (!showResult) {
                  buttonClass += isSelected 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-card hover:bg-muted border-border";
                } else {
                  if (isCorrect) {
                    buttonClass += "bg-green-500/20 border-green-500 text-green-700";
                  } else if (isSelected && !isCorrect) {
                    buttonClass += "bg-red-500/20 border-red-500 text-red-700";
                  } else {
                    buttonClass += "bg-muted border-border text-muted-foreground";
                  }
                }

                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={buttonClass}
                    onClick={() => !showResult && handleOptionSelect(index)}
                    disabled={showResult}
                    data-testid={`mcq-option-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background border flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Rationale (shown after selection) */}
            {isFlipped && card.rationale && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-semibold mb-2 text-primary">Explanation:</h4>
                <p className="text-sm">{card.rationale}</p>
              </div>
            )}

            {/* Source info */}
            {card.sourceId && (
              <div className="flex justify-center">
                <div className="inline-flex items-center space-x-2 text-xs bg-card px-3 py-2 rounded-lg">
                  <Book className="w-3 h-3 text-secondary" />
                  <span>Source: Lesson Content</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Legacy Term/Cloze Renderer
  const renderLegacyCard = () => (
    <Card 
      className={`glassmorphism border-border cursor-pointer flashcard ${isFlipped ? 'flipped' : ''}`}
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
              <h3 className="cinzel text-xl font-bold mb-4">{card.front}</h3>
              {!isFlipped && (
                <p className="text-sm text-muted-foreground">Click to reveal answer</p>
              )}
            </div>
          </div>
          
          {/* Back of card */}
          <div className="flashcard-back absolute inset-0 flex items-center justify-center text-center">
            <div>
              <h3 className="cinzel text-xl font-bold mb-4 text-primary">{card.back}</h3>
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
  );

  return (
    <div className="space-y-6">
      {/* Card Info */}
      <div className="text-center">
        <h2 className="cinzel text-3xl font-bold mb-2">iFlash Review Session</h2>
        <p className="text-muted-foreground">
          Card {cardNumber} of {totalCards} • 
          {card.reviewCount === 0 ? ' New card' : ` Reviewed ${card.reviewCount} times`}
        </p>
      </div>

      {/* Flashcard - MCQ or Legacy */}
      {card.type === 'mcq' && card.options ? renderMCQCard() : renderLegacyCard()}

      {/* Card Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground glassmorphism p-4 rounded-xl">
        <div>
          <p>Ease Factor: {card.difficulty.toFixed(1)}</p>
          <p>Current Interval: {card.interval} days</p>
        </div>
        {card.type !== 'mcq' && (
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
        )}
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