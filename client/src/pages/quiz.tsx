import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import QuizQuestion from "@/components/QuizQuestion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle, BarChart3, CheckCircle, X, Flag, HelpCircle, Target, Bot, TrendingUp } from "lucide-react";

interface QuestionBank {
  id: string;
  title: string;
  description: string;
  timeLimitSec: number;
}

interface Question {
  id: string;
  type: string;
  stem: string;
  options: string[];
  difficulty: string;
  topic: string;
  answerKey?: string;
  explanation?: string;
}

interface QuizSession {
  sessionId: string;
  questions: Question[];
  timeLimit: number;
  totalQuestions: number;
}

interface QuizResults {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  results: Array<{
    questionId: string;
    correct: boolean;
    userAnswer: any;
    correctAnswer: string;
    explanation?: string;
  }>;
}

export default function QuizPage() {
  const { bankId } = useParams<{ bankId?: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>();
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentQuestionFeedback, setCurrentQuestionFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null>(null);
  const { toast } = useToast();

  const { data: questionBanks } = useQuery<QuestionBank[]>({
    queryKey: ['/api/question-banks'],
  });

  const startQuizMutation = useMutation({
    mutationFn: async (bankId: string) => {
      const response = await apiRequest("POST", `/api/exams/${bankId}/start`);
      return response.json() as Promise<QuizSession>;
    },
    onSuccess: (data) => {
      setQuizSession(data);
      setTimeRemaining(data.timeLimit);
      
      // Start timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (!prev || prev <= 1) {
            clearInterval(timer);
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start quiz",
        variant: "destructive",
      });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string | string[] }) => {
      if (!quizSession) throw new Error("No active quiz session");
      await apiRequest("POST", `/api/exams/${quizSession.sessionId}/answer`, {
        questionId,
        answer
      });
    },
  });

  const finishQuizMutation = useMutation({
    mutationFn: async () => {
      if (!quizSession) throw new Error("No active quiz session");
      const response = await apiRequest("POST", `/api/exams/${quizSession.sessionId}/finish`);
      return response.json() as Promise<QuizResults>;
    },
    onSuccess: (data) => {
      setQuizResults(data);
      setQuizSession(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to finish quiz",
        variant: "destructive",
      });
    },
  });

  const handleStartQuiz = (bankId: string) => {
    startQuizMutation.mutate(bankId);
  };

  const handleAnswerChange = (answer: string | string[]) => {
    if (!quizSession) return;
    
    const currentQuestion = quizSession.questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    
    // Show immediate feedback in practice mode
    const isCorrect = answer === currentQuestion.answerKey;
    setCurrentQuestionFeedback({
      isCorrect,
      correctAnswer: currentQuestion.answerKey || 'A',
      explanation: currentQuestion.explanation
    });
    setShowFeedback(true);
    
    // Auto-save answer
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer
    });
    
    // Auto-advance to next question after 3 seconds
    setTimeout(() => {
      setShowFeedback(false);
      setCurrentQuestionFeedback(null);
      if (currentQuestionIndex < quizSession.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        handleFinishQuiz();
      }
    }, 3000);
  };

  const handleFlag = () => {
    if (!quizSession) return;
    
    const currentQuestion = quizSession.questions[currentQuestionIndex];
    const newFlagged = new Set(flaggedQuestions);
    
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    
    setFlaggedQuestions(newFlagged);
  };

  const handleNext = () => {
    if (!quizSession) return;
    
    if (currentQuestionIndex < quizSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishQuiz = () => {
    finishQuizMutation.mutate();
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Show quiz selection if no quiz is active
  if (!quizSession && !quizResults) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        
        <main className="ml-64 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="glassmorphism-card rounded-2xl p-8 mb-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center animate-elite-glow">
                    <HelpCircle className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <h1 className="cinzel text-4xl font-bold text-shimmer mb-2">
                      Practice Quiz Arena
                    </h1>
                    <p className="text-lg text-muted-foreground geist">
                      Test your knowledge with adaptive questions and instant AI feedback
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-accent" />
                    <span>Adaptive Learning</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-accent" />
                    <span>AI Feedback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span>Performance Tracking</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {questionBanks?.map((bank) => (
                  <Card key={bank.id} className="education-card p-6 group cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <HelpCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="cinzel text-xl font-bold group-hover:text-primary transition-colors">{bank.title}</h3>
                          <p className="text-sm text-muted-foreground">Practice Questions</p>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{bank.description}</p>
                      
                      <div className="flex items-center justify-between mb-6">
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {Math.floor(bank.timeLimitSec / 60)} minutes
                        </Badge>
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                          Practice Mode
                        </Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleStartQuiz(bank.id)}
                        disabled={startQuizMutation.isPending}
                        className="floating-action w-full text-background font-semibold"
                        data-testid={`button-start-quiz-${bank.id}`}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {startQuizMutation.isPending ? "Starting..." : "Start Quiz"}
                      </Button>
                    </div>
                  </Card>
                )) || (
                  <div className="col-span-full">
                    <Card className="education-card p-12 text-center">
                      <h3 className="cinzel text-2xl font-bold mb-4">Quiz Banks Coming Soon</h3>
                      <p className="text-muted-foreground mb-6">Practice quizzes are being prepared for your DFS-215 certification journey.</p>
                      <div className="space-y-4">
                        <div className="text-left space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-primary" />
                            </div>
                            <span>Law & Ethics Fundamentals</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-secondary" />
                            </div>
                            <span>Health Insurance & HMO Operations</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-accent" />
                            </div>
                            <span>OASDI, Medicare & Annuities</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show quiz results
  if (quizResults) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        
        <main className="ml-64 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <Card className="glassmorphism border-border">
                <CardContent className="p-8 text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                      {quizResults.score >= 70 ? (
                        <CheckCircle className="w-10 h-10 text-primary" />
                      ) : (
                        <X className="w-10 h-10 text-destructive" />
                      )}
                    </div>
                    <h2 className="cinzel text-3xl font-bold mb-2">Quiz Complete!</h2>
                    <p className="text-muted-foreground">
                      You scored {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-card rounded-xl">
                      <p className="text-2xl font-bold text-primary">{Math.round(quizResults.score)}%</p>
                      <p className="text-sm text-muted-foreground">Score</p>
                    </div>
                    <div className="p-4 bg-card rounded-xl">
                      <p className="text-2xl font-bold text-secondary">{quizResults.correctAnswers}</p>
                      <p className="text-sm text-muted-foreground">Correct</p>
                    </div>
                    <div className="p-4 bg-card rounded-xl">
                      <p className="text-2xl font-bold text-accent">{quizResults.totalQuestions - quizResults.correctAnswers}</p>
                      <p className="text-sm text-muted-foreground">Incorrect</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        setQuizResults(null);
                        setAnswers({});
                        setFlaggedQuestions(new Set());
                        setCurrentQuestionIndex(0);
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-take-another-quiz"
                    >
                      Take Another Quiz
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/iflash'}
                      className="ml-4"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Review with iFlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show active quiz
  if (quizSession) {
    const currentQuestion = quizSession.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    const isFlagged = flaggedQuestions.has(currentQuestion.id);

    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        
        <main className="ml-64 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Question */}
                <div className="lg:col-span-3">
                  <QuizQuestion
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={quizSession.totalQuestions}
                    selectedAnswer={currentAnswer || null}
                    onAnswerChange={handleAnswerChange}
                    onFlag={handleFlag}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    isFlagged={isFlagged}
                    timeRemaining={timeRemaining}
                    showFeedback={showFeedback}
                    correctAnswer={currentQuestionFeedback?.correctAnswer}
                  />
                </div>

                {/* Question Navigation */}
                <div className="space-y-6">
                  <Card className="glassmorphism border-border">
                    <CardContent className="p-4">
                      <h4 className="cinzel font-bold mb-3">Question Navigation</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {quizSession.questions.map((_, index) => {
                          const questionId = quizSession.questions[index].id;
                          const isAnswered = !!answers[questionId];
                          const isCurrent = index === currentQuestionIndex;
                          const isFlaggedQ = flaggedQuestions.has(questionId);
                          
                          return (
                            <Button
                              key={index}
                              onClick={() => handleQuestionNavigation(index)}
                              size="sm"
                              className={`w-8 h-8 p-0 text-xs font-semibold ${
                                isCurrent ? 'bg-accent text-accent-foreground' :
                                isFlaggedQ ? 'bg-destructive text-destructive-foreground' :
                                isAnswered ? 'bg-primary text-primary-foreground' :
                                'bg-muted text-muted-foreground'
                              }`}
                              data-testid={`nav-question-${index + 1}`}
                            >
                              {index + 1}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-primary rounded"></div>
                          <span className="text-muted-foreground">Answered</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-accent rounded"></div>
                          <span className="text-muted-foreground">Current</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-destructive rounded"></div>
                          <span className="text-muted-foreground">Flagged</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism border-border">
                    <CardContent className="p-4">
                      <h4 className="cinzel font-bold mb-3">Quiz Progress</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Answered</span>
                          <span>{Object.keys(answers).length}/{quizSession.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Flagged</span>
                          <span>{flaggedQuestions.size}</span>
                        </div>
                        {timeRemaining !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span>Time Left</span>
                            <span className="text-accent font-mono">
                              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism border-border border-destructive/50">
                    <CardContent className="p-4">
                      <h4 className="cinzel font-bold mb-3 text-destructive">Finish Quiz</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Once submitted, you cannot return to modify answers.
                      </p>
                      <Button
                        onClick={handleFinishQuiz}
                        disabled={finishQuizMutation.isPending}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-finish-quiz"
                      >
                        {finishQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
