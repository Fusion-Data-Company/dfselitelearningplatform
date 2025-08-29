import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Flag, ArrowLeft, ArrowRight, HelpCircle, Clock, CheckCircle, XCircle, Lightbulb } from "lucide-react";

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
  timeRemaining
}: QuizQuestionProps) {

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
                className={`${isFlagged ? 'border-yellow-500 bg-yellow-500/10 text-yellow-600' : 'border-muted/30'}`}
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
                    question.difficulty === 'M' ? 'border-yellow-500/30 text-yellow-600 bg-yellow-500/10' :
                    'border-red-500/30 text-red-600 bg-red-500/10'
                  }`}
                >
                  {question.difficulty === 'E' ? 'Easy' : 
                   question.difficulty === 'M' ? 'Medium' : 'Hard'}
                </Badge>
              </div>
            </div>
          
            {/* Answer Options */}
            <div className="space-y-4" data-testid="question-options">
              {question.type === 'mcq' || question.type === 'tf' ? (
                <RadioGroup 
                  value={selectedAnswer as string || ""} 
                  onValueChange={handleSingleChoice}
                  className="space-y-3"
                >
                  {question.options.map((option, index) => {
                    const optionId = String.fromCharCode(65 + index); // A, B, C, D
                    return (
                      <div key={optionId} className="flex items-center space-x-3">
                        <RadioGroupItem 
                          value={optionId} 
                          id={optionId}
                          className="text-primary border-primary/50"
                        />
                        <Label 
                          htmlFor={optionId}
                          className="flex-1 cursor-pointer p-4 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 geist"
                          data-testid={`option-${optionId}`}
                        >
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3 inline-flex">
                            {optionId}
                          </span>
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              ) : (
                // Multiple select
                <div className="space-y-3">
                  {question.options.map((option, index) => {
                    const optionId = String.fromCharCode(65 + index);
                    const isChecked = Array.isArray(selectedAnswer) && selectedAnswer.includes(optionId);
                    
                    return (
                      <div key={optionId} className="flex items-center space-x-3">
                        <Checkbox
                          id={optionId}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleMultipleChoice(optionId, !!checked)}
                          className="border-primary/50"
                        />
                        <Label 
                          htmlFor={optionId}
                          className="flex-1 cursor-pointer p-4 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 geist"
                          data-testid={`option-${optionId}`}
                        >
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3 inline-flex">
                            {optionId}
                          </span>
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
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
