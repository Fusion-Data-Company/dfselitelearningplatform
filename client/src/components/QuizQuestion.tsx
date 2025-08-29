import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, ArrowLeft, ArrowRight, HelpCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface Question {
  id: string;
  type: string;
  stem: string;
  options: string[];
  difficulty: string;
  topic: string;
}

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | string[] | null;
  onAnswerChange: (answer: string | string[]) => void;
  onFlag: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isFlagged: boolean;
  showNavigation?: boolean;
  timeRemaining?: number;
  showFeedback?: boolean;
  correctAnswer?: string;
}

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerChange,
  onFlag,
  onPrevious,
  onNext,
  isFlagged,
  showNavigation = true,
  timeRemaining,
  showFeedback = false,
  correctAnswer
}: QuizQuestionProps) {
  const [showResult, setShowResult] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSingleChoice = (value: string) => {
    onAnswerChange(value);
  };

  const handleMultipleChoice = (value: string, checked: boolean) => {
    const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : [];
    if (checked) {
      onAnswerChange([...currentAnswers, value]);
    } else {
      onAnswerChange(currentAnswers.filter(a => a !== value));
    }
  };

  return (
    <Card className="education-card border-accent/20 hover:border-accent/40 transition-all duration-300">
      <CardContent className="p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-chart-2/3 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Badge className="elite-badge bg-gradient-to-r from-accent/30 to-accent/20 text-accent border-accent/40">
                Question {questionNumber} of {totalQuestions}
              </Badge>
              <Badge variant="outline" className="border-chart-2/30 text-chart-2 bg-chart-2/10">
                {question.topic}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              {timeRemaining !== undefined && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className={timeRemaining < 300 ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onFlag}
                className={`${isFlagged ? 'border-orange-500 bg-orange-500/10 text-orange-600' : 'border-muted/30'}`}
              >
                <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted/40 rounded-full h-3 relative overflow-hidden shadow-inner mb-8">
            <div 
              className="lesson-progress h-3 rounded-full transition-all duration-500"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            ></div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-chart-2 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg leading-relaxed text-foreground mb-4">
                  {question.stem}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    question.difficulty === 'E' ? 'border-green-500/30 text-green-600 bg-green-500/10' :
                    question.difficulty === 'M' ? 'border-blue-500/30 text-blue-600 bg-blue-500/10' :
                    'border-red-500/30 text-red-600 bg-red-500/10'
                  }`}
                >
                  {question.difficulty === 'E' ? 'Easy' : 
                   question.difficulty === 'M' ? 'Medium' : 'Hard'}
                </Badge>
              </div>
            </div>
          
            {/* MCQ Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" data-testid="question-options">
              {question.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = selectedAnswer === optionLetter;
                const isCorrect = showFeedback && correctAnswer === optionLetter;
                const isWrong = showFeedback && isSelected && correctAnswer !== optionLetter;
                
                let cardClass = "glassmorphism border-border bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:scale-[1.02] cursor-pointer";
                
                if (showFeedback) {
                  if (isCorrect) {
                    cardClass = "glassmorphism border-green-500/70 bg-gradient-to-br from-green-50/80 to-green-100/60 backdrop-blur-xl";
                  } else if (isWrong) {
                    cardClass = "glassmorphism border-red-500/70 bg-gradient-to-br from-red-50/80 to-red-100/60 backdrop-blur-xl";
                  } else {
                    cardClass = "glassmorphism border-border/50 bg-gradient-to-br from-card/40 to-card/30 backdrop-blur-xl opacity-70";
                  }
                } else if (isSelected) {
                  cardClass = "glassmorphism border-primary/70 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl";
                }
                
                if (showFeedback) {
                  cardClass = cardClass.replace("cursor-pointer", "cursor-default");
                }
                
                return (
                  <Card
                    key={optionLetter}
                    className={cardClass}
                    onClick={() => !showFeedback && handleSingleChoice(optionLetter)}
                    data-testid={`option-${optionLetter}`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.8s ease-out forwards'
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Option Letter */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-300 ${
                          showFeedback && isCorrect
                            ? 'border-green-500 bg-green-500 text-white'
                            : showFeedback && isWrong
                            ? 'border-red-500 bg-red-500 text-white'
                            : isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground bg-muted text-muted-foreground'
                        }`}>
                          {optionLetter}
                        </div>
                        
                        {/* Option Text */}
                        <div className="flex-1">
                          <p className={`font-medium leading-relaxed transition-colors duration-300 ${
                            showFeedback && (isCorrect || isWrong) ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {option}
                          </p>
                        </div>
                        
                        {/* Feedback Icons */}
                        {showFeedback && isCorrect && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white fill-current" />
                          </div>
                        )}
                        {showFeedback && isWrong && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-white fill-current" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={questionNumber === 1}
              className="border-muted-foreground/30 hover:bg-muted/20"
              data-testid="button-previous"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-3">
              {selectedAnswer && (
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Answered
                </Badge>
              )}
            </div>
            
            <Button
              onClick={onNext}
              className="floating-action px-6 py-3"
              data-testid="button-next"
            >
              {questionNumber === totalQuestions ? 'Submit Quiz' : 'Next Question'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
