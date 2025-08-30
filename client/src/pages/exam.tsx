import { useState, useEffect } from "react";
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
import { Shield, Clock, PlayCircle, AlertTriangle, CheckCircle, X } from "lucide-react";

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
}

interface ExamSession {
  sessionId: string;
  questions: Question[];
  timeLimit: number;
  totalQuestions: number;
}

interface ExamResults {
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

export default function ExamPage() {
  const { bankId } = useParams<{ bankId?: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [examResults, setExamResults] = useState<ExamResults | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>();
  const [examStarted, setExamStarted] = useState(false);
  const [proctorActive, setProctorActive] = useState(false);
  const { toast } = useToast();

  const { data: questionBanks } = useQuery<QuestionBank[]>({
    queryKey: ['/api/question-banks'],
  });

  // Proctor monitoring
  useEffect(() => {
    if (examSession && proctorActive) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          toast({
            title: "ProctorBot Alert",
            description: "Focus on your exam window. Tab switching is monitored.",
            variant: "destructive",
          });
        }
      };

      const handleBlur = () => {
        toast({
          title: "ProctorBot Alert", 
          description: "Please keep focus on the exam window.",
          variant: "destructive",
        });
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, [examSession, proctorActive, toast]);

  const startExamMutation = useMutation({
    mutationFn: async (bankId: string) => {
      const response = await apiRequest("POST", `/api/exams/${bankId}/start`);
      return response.json() as Promise<ExamSession>;
    },
    onSuccess: (data) => {
      setExamSession(data);
      setTimeRemaining(data.timeLimit);
      setProctorActive(true);
      
      // Start timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (!prev || prev <= 1) {
            clearInterval(timer);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start exam",
        variant: "destructive",
      });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string | string[] }) => {
      if (!examSession) throw new Error("No active exam session");
      await apiRequest("POST", `/api/exams/${examSession.sessionId}/answer`, {
        questionId,
        answer
      });
    },
  });

  const finishExamMutation = useMutation({
    mutationFn: async () => {
      if (!examSession) throw new Error("No active exam session");
      const response = await apiRequest("POST", `/api/exams/${examSession.sessionId}/finish`);
      return response.json() as Promise<ExamResults>;
    },
    onSuccess: (data) => {
      setExamResults(data);
      setExamSession(null);
      setProctorActive(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to finish exam",
        variant: "destructive",
      });
    },
  });

  const handleStartExam = (bankId: string) => {
    setExamStarted(true);
    startExamMutation.mutate(bankId);
  };

  const handleAnswerChange = (answer: string | string[]) => {
    if (!examSession) return;
    
    const currentQuestion = examSession.questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    
    // Auto-save answer
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer
    });
  };

  const handleFlag = () => {
    if (!examSession) return;
    
    const currentQuestion = examSession.questions[currentQuestionIndex];
    const newFlagged = new Set(flaggedQuestions);
    
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    
    setFlaggedQuestions(newFlagged);
  };

  const handleNext = () => {
    if (!examSession) return;
    
    if (currentQuestionIndex < examSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishExam();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishExam = () => {
    finishExamMutation.mutate();
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Show exam selection if no exam is active
  if (!examSession && !examResults && !examStarted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Flowing Cyan Background */}
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(/exam-bg.jpg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        />
        
        <Navigation />
        <Sidebar />
        
        <main className="ml-64 pt-16 min-h-screen relative z-10">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="glassmorphism-card rounded-2xl p-8 mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mr-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h1 className="cinzel text-4xl font-bold text-shimmer mb-2">
                      DFS-215 Certification Exam
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Official proctored examination with ProctorBot monitoring
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-destructive" />
                    <span>Timed & Monitored</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    <span>ProctorBot Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span>Official Certification</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {questionBanks?.map((bank) => (
                  <Card key={bank.id} className="education-card p-6 group cursor-pointer relative overflow-hidden border-destructive/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="cinzel text-xl font-bold group-hover:text-destructive transition-colors">{bank.title}</h3>
                          <p className="text-sm text-muted-foreground">Official Certification Exam</p>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-6">{bank.description}</p>
                      
                      <div className="flex items-center justify-between mb-6">
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.floor(bank.timeLimitSec / 60)} minutes
                        </Badge>
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          <Shield className="w-3 h-3 mr-1" />
                          ProctorBot Active
                        </Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleStartExam(bank.id)}
                        disabled={startExamMutation.isPending}
                        className="w-full bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/80 hover:to-destructive text-white font-semibold"
                        data-testid={`button-start-exam-${bank.id}`}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {startExamMutation.isPending ? "Initializing ProctorBot..." : "Begin Certification Exam"}
                      </Button>
                    </div>
                  </Card>
                )) || (
                  <div className="col-span-full">
                    <Card className="education-card p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="cinzel text-2xl font-bold mb-4">Certification Exams Coming Soon</h3>
                      <p className="text-muted-foreground mb-6">Official DFS-215 certification examinations are being prepared with ProctorBot integration.</p>
                      <div className="space-y-3 text-left max-w-md mx-auto">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-destructive" />
                          <span>Timed examination environment</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-destructive" />
                          <span>ProctorBot monitoring system</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-destructive" />
                          <span>Official certification scoring</span>
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

  // Show exam results
  if (examResults) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Flowing Cyan Background */}
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(/exam-bg.jpg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        />
        
        <Navigation />
        <Sidebar />
        
        <main className="ml-64 pt-16 min-h-screen relative z-10">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <Card className="glassmorphism border-border">
                <CardContent className="p-8 text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                      {examResults.score >= 70 ? (
                        <CheckCircle className="w-10 h-10 text-primary" />
                      ) : (
                        <X className="w-10 h-10 text-destructive" />
                      )}
                    </div>
                    <h2 className="cinzel text-3xl font-bold mb-2">Exam Complete!</h2>
                    <p className="text-muted-foreground">
                      You scored {examResults.correctAnswers} out of {examResults.totalQuestions} questions
                    </p>
                    <Badge 
                      variant={examResults.score >= 70 ? "default" : "destructive"}
                      className="mt-2"
                    >
                      {examResults.score >= 70 ? "PASSED" : "NEEDS REVIEW"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-card rounded-xl">
                      <p className="text-2xl font-bold text-primary">{Math.round(examResults.score)}%</p>
                      <p className="text-sm text-muted-foreground">Final Score</p>
                    </div>
                    <div className="p-4 bg-card rounded-xl">
                      <p className="text-2xl font-bold text-secondary">{examResults.correctAnswers}</p>
                      <p className="text-sm text-muted-foreground">Correct</p>
                    </div>
                    <div className="p-4 bg-card rounded-xl">
                      <p className="text-2xl font-bold text-destructive">{examResults.totalQuestions - examResults.correctAnswers}</p>
                      <p className="text-sm text-muted-foreground">Incorrect</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        setExamResults(null);
                        setAnswers({});
                        setFlaggedQuestions(new Set());
                        setCurrentQuestionIndex(0);
                        setExamStarted(false);
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-take-another-exam"
                    >
                      Take Another Exam
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/'}
                      className="ml-4"
                    >
                      Return to Dashboard
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

  // Show active exam
  if (examSession) {
    const currentQuestion = examSession.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    const isFlagged = flaggedQuestions.has(currentQuestion.id);

    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Flowing Cyan Background */}
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(/exam-bg.jpg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        />
        
        <Navigation />
        <Sidebar />
        
        {/* ProctorBot Panel */}
        {proctorActive && (
          <div className="fixed top-16 left-96 right-0 z-40 ai-agent-panel border-b border-primary/30 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">ProctorBot Active</h3>
                <p className="text-sm text-muted-foreground">
                  Monitoring exam integrity. Focus on your window and avoid suspicious behavior.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className="exam-timer text-2xl font-bold">
                  {timeRemaining ? `${Math.floor(timeRemaining / 3600)}:${Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, '0')}:${(timeRemaining % 60).toString().padStart(2, '0')}` : '00:00:00'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <main className={`ml-96 ${proctorActive ? 'pt-32' : 'pt-16'} min-h-screen`}>
          <div className="p-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Question */}
                <div className="lg:col-span-3">
                  <QuizQuestion
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={examSession.totalQuestions}
                    selectedAnswer={currentAnswer || null}
                    onAnswerChange={handleAnswerChange}
                    onFlag={handleFlag}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    isFlagged={isFlagged}
                    showNavigation={false}
                    timeRemaining={timeRemaining}
                  />
                </div>

                {/* Exam Sidebar */}
                <div className="space-y-6">
                  {/* Question Overview */}
                  <Card className="glassmorphism border-border">
                    <CardContent className="p-4">
                      <h4 className="cinzel font-bold mb-3">Question Overview</h4>
                      <div className="grid grid-cols-5 gap-1">
                        {examSession.questions.map((_, index) => {
                          const questionId = examSession.questions[index].id;
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
                      
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-primary rounded"></div>
                          <span className="text-muted-foreground">Answered ({Object.keys(answers).length})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-accent rounded"></div>
                          <span className="text-muted-foreground">Current (1)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-destructive rounded"></div>
                          <span className="text-muted-foreground">Flagged ({flaggedQuestions.size})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-muted rounded"></div>
                          <span className="text-muted-foreground">Remaining ({examSession.totalQuestions - Object.keys(answers).length})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exam Controls */}
                  <Card className="glassmorphism border-border">
                    <CardContent className="p-4">
                      <h4 className="cinzel font-bold mb-3">Exam Controls</h4>
                      <div className="space-y-2">
                        <Button
                          onClick={handleFlag}
                          variant="outline"
                          className={`w-full ${
                            isFlagged 
                              ? 'bg-destructive/20 text-destructive border-destructive/50' 
                              : 'bg-accent/20 text-accent border-accent/50'
                          }`}
                          data-testid="button-flag-question"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {isFlagged ? 'Unflag' : 'Flag Question'}
                        </Button>
                        <div className="text-xs text-muted-foreground text-center p-2 bg-card rounded">
                          Auto-Save: Active
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Exam */}
                  <Card className="glassmorphism border-destructive/50">
                    <CardContent className="p-4">
                      <h4 className="cinzel font-bold mb-3 text-destructive">Submit Exam</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Once submitted, you cannot return to modify answers.
                      </p>
                      <Button
                        onClick={handleFinishExam}
                        disabled={finishExamMutation.isPending}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-submit-exam"
                      >
                        {finishExamMutation.isPending ? "Submitting..." : "Submit Exam"}
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
