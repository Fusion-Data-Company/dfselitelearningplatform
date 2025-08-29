import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Flag, ArrowLeft, ArrowRight } from "lucide-react";

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
    <Card className="glassmorphism border-border">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="cinzel text-2xl font-bold">
              {showNavigation ? 'Practice Quiz' : 'Exam Question'}
            </h2>
            <p className="text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>
          {timeRemaining !== undefined && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Time Remaining</p>
              <p className="text-xl font-bold text-accent">
                {formatTime(timeRemaining)}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-8">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold leading-relaxed">
              {question.stem}
            </h3>
            <div className="flex items-center space-x-2 ml-4">
              <Badge variant="outline" className="text-xs">
                {question.topic}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  question.difficulty === 'E' ? 'text-green-500' :
                  question.difficulty === 'M' ? 'text-yellow-500' :
                  'text-red-500'
                }`}
              >
                {question.difficulty === 'E' ? 'Easy' : 
                 question.difficulty === 'M' ? 'Medium' : 'Hard'}
              </Badge>
            </div>
          </div>
          
          {/* Answer Options */}
          <div className="space-y-3" data-testid="question-options">
            {question.type === 'mcq' || question.type === 'tf' ? (
              <RadioGroup 
                value={selectedAnswer as string || ""} 
                onValueChange={handleSingleChoice}
              >
                {question.options.map((option, index) => {
                  const optionId = String.fromCharCode(65 + index); // A, B, C, D
                  return (
                    <div key={optionId} className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={optionId} 
                        id={optionId}
                        className="text-primary"
                      />
                      <Label 
                        htmlFor={optionId}
                        className="flex-1 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                        data-testid={`option-${optionId}`}
                      >
                        <span className="font-medium mr-2">{optionId}.</span>
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
                        className="text-primary"
                      />
                      <Label 
                        htmlFor={optionId}
                        className="flex-1 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                        data-testid={`option-${optionId}`}
                      >
                        <span className="font-medium mr-2">{optionId}.</span>
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
            className="px-6 py-3"
            data-testid="button-previous"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={onFlag}
              className={`px-6 py-3 ${
                isFlagged 
                  ? 'bg-destructive/20 text-destructive border-destructive/50' 
                  : 'bg-accent/20 text-accent border-accent/50'
              }`}
              data-testid="button-flag"
            >
              <Flag className="w-4 h-4 mr-2" />
              {isFlagged ? 'Unflag' : 'Flag for Review'}
            </Button>
            
            <Button
              onClick={onNext}
              className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-next"
            >
              {questionNumber === totalQuestions ? 'Finish' : 'Next Question'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
