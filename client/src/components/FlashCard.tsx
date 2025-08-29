import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Book, RotateCcw, CheckCircle, XCircle, Layers3, Mic, Volume2 } from "lucide-react";

interface VoiceQAResponse {
  answer: string;
  audioUrl?: string;
  citations?: string[];
}

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
  const [voiceAnswer, setVoiceAnswer] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const { toast } = useToast();

  const voiceQAMutation = useMutation<VoiceQAResponse, Error, string>({
    mutationFn: async (question: string) => {
      const context = normalizedCard.type === 'mcq' && normalizedCard.prompt 
        ? normalizedCard.prompt 
        : normalizedCard.front || '';
      
      const response = await apiRequest("POST", "/api/voice-qa", {
        question,
        context: context + (normalizedCard.rationale ? ' Explanation: ' + normalizedCard.rationale : '')
      });
      return response as unknown as VoiceQAResponse;
    },
    onSuccess: (response: VoiceQAResponse) => {
      setVoiceAnswer(response.answer);
      if (response.audioUrl) {
        setAudioUrl(response.audioUrl);
        // Auto-play the audio
        const audio = new Audio(response.audioUrl);
        audio.play().catch(console.error);
      }
    },
    onError: (error) => {
      toast({
        title: "Voice Q&A Error",
        description: error instanceof Error ? error.message : "Failed to get voice answer",
        variant: "destructive",
      });
    },
  });

  const handleVoiceQA = () => {
    const question = normalizedCard.type === 'mcq' && normalizedCard.prompt 
      ? `Explain this insurance concept: ${normalizedCard.prompt}` 
      : `Please explain: ${normalizedCard.front}`;
    
    voiceQAMutation.mutate(question);
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  // Normalize legacy MCQ cards on-the-fly
  const normalizedCard = useMemo(() => {
    if (card.type === 'mcq' && !card.options && card.front) {
      try {
        const text = card.front;
        
        // Try line-by-line format first
        const multilineMatches = text.match(/^(.*?)(?:\r?\n|\r)\s*[ABCD]\)/m);
        
        if (multilineMatches) {
          const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
          const prompt = lines[0].replace(/:?\s*$/, '');
          
          const options: string[] = [];
          const optionRegex = /^([ABCD])\)\s*(.+)$/;
          
          for (let i = 1; i < lines.length; i++) {
            const match = lines[i].match(optionRegex);
            if (match) {
              options.push(match[2].trim());
            }
          }
          
          if (options.length >= 2) {
            let answerIndex: number | null = null;
            if (card.back) {
              const answerMatch = card.back.match(/(?:answer|correct)[\s:]*([ABCD])/i) || 
                                 card.back.match(/\b([ABCD])\)/);
              if (answerMatch) {
                const letter = answerMatch[1].toUpperCase();
                answerIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
              }
            }
            
            const normalized = {
              ...card,
              prompt,
              options,
              answerIndex,
              rationale: card.back || null
            };
            
            return normalized;
          }
        }
        
        // Handle inline format with comma separation: "Question: A) opt, B) opt, C) opt, D) opt"
        if (text.includes(', A)') || text.includes(', B)') || text.includes(', C)') || text.includes(', D)')) {
          // Comma-separated format
          const parts = text.split(/,\s*(?=[ABCD]\))/);
          const prompt = parts[0].trim().replace(/:?\s*$/, '');
          const options = parts.slice(1).map(part => {
            const match = part.match(/^[ABCD]\)\s*(.+)$/);
            return match ? match[1].trim() : '';
          }).filter(opt => opt.length > 0);
          
          if (options.length >= 2) {
            let answerIndex: number | null = null;
            if (card.back) {
              const answerMatch = card.back.match(/(?:answer|correct)[\s:]*([ABCD])/i) || 
                                 card.back.match(/\b([ABCD])\)/);
              if (answerMatch) {
                const letter = answerMatch[1].toUpperCase();
                answerIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
              }
            }
            
            const normalized = {
              ...card,
              prompt,
              options,
              answerIndex,
              rationale: card.back || null
            };
            
            return normalized;
          }
        } else {
          // Space-separated format fallback: "Question A) opt B) opt C) opt D) opt" 
          const optionRegex = /([ABCD])\)\s*([^,]*?)(?=\s*[ABCD]\)|$)/gi;
          const matches = Array.from(text.matchAll(optionRegex));
          
          if (matches.length >= 2) {
            const firstMatch = matches[0];
            const prompt = text.substring(0, firstMatch.index || 0).trim().replace(/:?\s*$/, '');
            const options = matches.map(match => match[2].trim());
            
            let answerIndex: number | null = null;
            if (card.back) {
              const answerMatch = card.back.match(/(?:answer|correct)[\s:]*([ABCD])/i) || 
                                 card.back.match(/\b([ABCD])\)/);
              if (answerMatch) {
                const letter = answerMatch[1].toUpperCase();
                answerIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
              }
            }
            
            const normalized = {
              ...card,
              prompt,
              options,
              answerIndex,
              rationale: card.back || null
            };
            
            return normalized;
          }
        }
      } catch (error) {
        console.error('Error normalizing MCQ:', error);
      }
    }
    return card;
  }, [card]);

  const handleFlip = () => {
    if (normalizedCard.type === 'mcq' && normalizedCard.options && selectedOption === null) {
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

  // Premium MCQ Renderer
  const renderMCQCard = () => {
    if (!normalizedCard.options || !normalizedCard.prompt) {
      return renderLegacyCard();
    }

    return (
      <div className="space-y-8">
        {/* Question Card */}
        <Card className="glassmorphism border-border bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-medium px-4 py-2">
                Multiple Choice Question
              </Badge>
              <h2 className="cinzel text-2xl font-bold leading-relaxed text-foreground">
                {normalizedCard.prompt}
              </h2>
            </div>
          </CardContent>
        </Card>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {normalizedCard.options!.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = normalizedCard.answerIndex === index;
            const showResult = isFlipped;
            
            let cardClass = "group relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ";
            let iconColor = "";
            let textColor = "text-foreground";
            let bgClass = "";
            
            if (!showResult) {
              if (isSelected) {
                cardClass += "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/40 shadow-lg shadow-primary/20";
                textColor = "text-primary";
              } else {
                cardClass += "glassmorphism border-border bg-gradient-to-br from-card/60 to-card/40 hover:from-card/80 hover:to-card/60 hover:border-border/60";
              }
            } else {
              if (isCorrect) {
                cardClass += "bg-gradient-to-br from-green-500/20 to-green-400/10 border-green-500/40 shadow-lg shadow-green-500/20";
                textColor = "text-green-700 dark:text-green-300";
                iconColor = "text-green-600";
              } else if (isSelected && !isCorrect) {
                cardClass += "bg-gradient-to-br from-red-500/20 to-red-400/10 border-red-500/40 shadow-lg shadow-red-500/20";
                textColor = "text-red-700 dark:text-red-300";
                iconColor = "text-red-600";
              } else {
                cardClass += "glassmorphism border-border bg-gradient-to-br from-muted/40 to-muted/20";
                textColor = "text-muted-foreground";
              }
              cardClass = cardClass.replace("cursor-pointer", "cursor-default");
            }

            return (
              <Card
                key={index}
                className={cardClass}
                onClick={() => !showResult && handleOptionSelect(index)}
                data-testid={`mcq-option-${index}`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    {/* Option Letter */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-300 ${
                      showResult && isCorrect 
                        ? "bg-green-500 border-green-500 text-white"
                        : showResult && isSelected && !isCorrect
                          ? "bg-red-500 border-red-500 text-white"
                          : isSelected && !showResult
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-background border-border text-muted-foreground group-hover:border-foreground/20"
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    
                    {/* Option Text */}
                    <span className={`flex-1 text-base font-medium leading-relaxed ${textColor}`}>
                      {option}
                    </span>
                    
                    {/* Result Icons */}
                    {showResult && (
                      <div className="flex-shrink-0">
                        {isCorrect && (
                          <CheckCircle className={`w-6 h-6 ${iconColor}`} />
                        )}
                        {isSelected && !isCorrect && (
                          <XCircle className={`w-6 h-6 ${iconColor}`} />
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Explanation */}
        {isFlipped && normalizedCard.rationale && (
          <Card className="glassmorphism border-border bg-gradient-to-br from-blue-500/10 to-blue-400/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Book className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    Explanation
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {normalizedCard.rationale}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Q&A Section */}
        <Card className="glassmorphism border-border bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-accent flex items-center space-x-2">
                <Mic className="w-4 h-4" />
                <span>Voice Q&A</span>
              </h4>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleVoiceQA}
                  disabled={voiceQAMutation.isPending}
                  size="sm"
                  className="bg-accent/20 hover:bg-accent/30 text-accent border-accent/30"
                  data-testid="button-voice-qa"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {voiceQAMutation.isPending ? 'Processing...' : 'Ask AI'}
                </Button>
                {audioUrl && (
                  <Button
                    onClick={playAudio}
                    size="sm"
                    variant="outline"
                    className="border-accent/30 text-accent"
                    data-testid="button-play-audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {voiceAnswer && (
              <div className="bg-background/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {voiceAnswer}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Legacy Term/Cloze Renderer
  const renderLegacyCard = () => (
    <div className="space-y-8">
      <Card 
        className={`glassmorphism border-border cursor-pointer flashcard ${isFlipped ? 'flipped' : ''} bg-gradient-to-br from-card/80 to-card/60`}
        onClick={handleFlip}
        data-testid="flashcard"
      >
        <CardContent className="p-8 h-64 relative">
          <div className="flashcard-inner relative w-full h-full">
            {/* Front of card */}
            <div className="flashcard-front absolute inset-0 flex items-center justify-center text-center">
              <div>
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2 bg-primary/10 border-primary/20 text-primary">
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
                {normalizedCard.sourceId && (
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

      {/* Voice Q&A Section for Legacy Cards */}
      <Card className="glassmorphism border-border bg-gradient-to-br from-accent/10 to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-accent flex items-center space-x-2">
              <Mic className="w-4 h-4" />
              <span>Voice Q&A</span>
            </h4>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleVoiceQA}
                disabled={voiceQAMutation.isPending}
                size="sm"
                className="bg-accent/20 hover:bg-accent/30 text-accent border-accent/30"
                data-testid="button-voice-qa"
              >
                <Mic className="w-4 h-4 mr-2" />
                {voiceQAMutation.isPending ? 'Processing...' : 'Ask AI'}
              </Button>
              {audioUrl && (
                <Button
                  onClick={playAudio}
                  size="sm"
                  variant="outline"
                  className="border-accent/30 text-accent"
                  data-testid="button-play-audio"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {voiceAnswer && (
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {voiceAnswer}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen education-bg floating-orbs fading-shapes background-shapes">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Apple x Skool Header */}
        <div className="relative">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-8 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Layers3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">iFlash</h1>
                <p className="text-sm text-muted-foreground">Adaptive Learning System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-primary font-medium">{cardNumber} / {totalCards}</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted/20 rounded-lg">
                  <span className="text-muted-foreground">
                    {card.reviewCount === 0 ? 'New' : `${card.reviewCount}x reviewed`}
                  </span>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Session Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-foreground">Review Progress</h2>
              <span className="text-sm text-muted-foreground">{Math.round((cardNumber / totalCards) * 100)}% complete</span>
            </div>
            <div className="w-full bg-muted/20 rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                style={{ width: `${(cardNumber / totalCards) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        {normalizedCard.type === 'mcq' && normalizedCard.options ? renderMCQCard() : renderLegacyCard()}

        {/* Card Stats */}
        <Card className="glassmorphism border-border bg-gradient-to-br from-card/40 to-card/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-chart-2/60"></div>
                  <span>Ease Factor: {card.difficulty.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-chart-3/60"></div>
                  <span>Current Interval: {card.interval} days</span>
                </div>
              </div>
              {normalizedCard.type !== 'mcq' && (
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
          </CardContent>
        </Card>

        {/* Response Buttons */}
        {isFlipped && (
          <Card className="glassmorphism border-border bg-gradient-to-br from-card/40 to-card/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-center mb-6 cinzel">How did you do?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((grade) => {
                  const info = getGradeInfo(grade);
                  return (
                    <Button
                      key={grade}
                      onClick={() => handleGrade(grade)}
                      className="h-auto p-6 flex-col space-y-2 bg-gradient-to-br from-background/60 to-background/40 hover:from-background/80 hover:to-background/60 border border-border hover:border-primary/40 transition-all duration-300"
                      variant="outline"
                      data-testid={`button-grade-${grade}`}
                    >
                      <div className="text-center">
                        <p className="font-semibold text-base">{info.label}</p>
                        <p className="text-xs opacity-75 mt-1">{info.time}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}