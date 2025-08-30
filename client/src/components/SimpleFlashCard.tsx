import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface SimpleFlashCardProps {
  card: {
    id: string;
    type: string;
    front?: string;
    back?: string;
    prompt?: string;
    options?: string[];
    answerIndex?: number;
    rationale?: string;
  };
  onCorrect: () => void;
  onIncorrect: () => void;
  cardNumber: number;
  totalCards: number;
}

export default function SimpleFlashCard({ card, onCorrect, onIncorrect, cardNumber, totalCards }: SimpleFlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card.id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Handle multiple choice cards
  if (card.type === 'multiple_choice' && card.options) {
    return (
      <div className="space-y-6">
        {/* Question */}
        <Card className="glassmorphism-card min-h-[300px]">
          <CardContent className="p-8 flex items-center justify-center text-center">
            <div>
              <h2 className="cinzel text-2xl font-bold mb-4">{card.prompt}</h2>
              <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                {card.options.map((option, index) => (
                  <div key={index} className="p-3 bg-card/50 rounded-lg border">
                    <span className="font-medium">{String.fromCharCode(65 + index)}) </span>
                    {option}
                  </div>
                ))}
              </div>
              {card.rationale && isFlipped && (
                <div className="mt-6 p-4 bg-blue-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">{card.rationale}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Answer Buttons */}
        <div className="flex justify-center space-x-6">
          <Button 
            onClick={onIncorrect}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white w-20 h-20 rounded-full"
            data-testid="button-incorrect"
          >
            <XCircle className="w-8 h-8" />
          </Button>
          <Button 
            onClick={onCorrect}
            size="lg" 
            className="bg-green-500 hover:bg-green-600 text-white w-20 h-20 rounded-full"
            data-testid="button-correct"
          >
            <CheckCircle className="w-8 h-8" />
          </Button>
        </div>
      </div>
    );
  }

  // Handle basic front/back cards
  return (
    <div className="space-y-6">
      {/* Card */}
      <Card 
        className="glassmorphism-card min-h-[300px] cursor-pointer"
        onClick={handleFlip}
        data-testid="flashcard"
      >
        <CardContent className="p-8 flex items-center justify-center text-center">
          <div>
            {!isFlipped ? (
              <>
                <h2 className="cinzel text-2xl font-bold mb-4">{card.front}</h2>
                <p className="text-sm text-muted-foreground">Click to reveal answer</p>
              </>
            ) : (
              <h2 className="cinzel text-2xl font-bold text-primary">{card.back}</h2>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Buttons - only show when flipped */}
      {isFlipped && (
        <div className="flex justify-center space-x-6">
          <Button 
            onClick={onIncorrect}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white w-20 h-20 rounded-full"
            data-testid="button-incorrect"
          >
            <XCircle className="w-8 h-8" />
          </Button>
          <Button 
            onClick={onCorrect}
            size="lg" 
            className="bg-green-500 hover:bg-green-600 text-white w-20 h-20 rounded-full"
            data-testid="button-correct"
          >
            <CheckCircle className="w-8 h-8" />
          </Button>
        </div>
      )}

      {/* Card Counter */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Card {cardNumber} of {totalCards}
        </p>
      </div>
    </div>
  );
}