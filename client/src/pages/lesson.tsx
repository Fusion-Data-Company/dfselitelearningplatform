import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import CoachBotModal from "@/components/CoachBotModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  BookOpen, 
  Play, 
  Layers3, 
  HelpCircle, 
  CheckCircle,
  Brain,
  ArrowLeft,
  Clock,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Award,
  Timer,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

// Import types from lesson schema
interface Checkpoint {
  id: string;
  type: 'intro' | 'objectives' | 'reading' | 'video' | 'iflash' | 'microquiz' | 'reflection' | 'completion';
  title?: string;
  bodyMd?: string;
  videoUrl?: string;
  quiz?: {
    items: QuizItem[];
  };
  gate?: {
    type: 'time' | 'quiz' | 'interaction';
    value: number;
  };
  orderIndex: number;
}

interface QuizItem {
  id: string;
  type: 'mcq' | 'tf';
  stem: string;
  options: string[];
  answerIndex: number;
  rationale: string;
}

interface LessonDTO {
  id: string;
  slug: string;
  title: string;
  track: string;
  module: string;
  order: number;
  checkpoints: Checkpoint[];
  estMinutes: number;
  published: boolean;
  ce?: {
    hours: number;
    seatTimeMin: number;
  };
}

interface CheckpointProgress {
  checkpointId: string;
  completed: boolean;
  timeSpent: number;
  lastAccessed: string;
  quizScore?: number;
  quizPassed?: boolean;
  reflection?: string;
}

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [checkpointProgress, setCheckpointProgress] = useState<Record<string, CheckpointProgress>>({});
  const [coachBotOpen, setCoachBotOpen] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [reflection, setReflection] = useState("");
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [minimumReadingMet, setMinimumReadingMet] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkpointTimerRef = useRef<Record<string, number>>({});

  const { data: lesson, isLoading, error } = useQuery<LessonDTO>({
    queryKey: ['/api/lessons/slug', slug],
    enabled: !!slug,
  });

  const progressMutation = useMutation({
    mutationFn: async (data: {
      checkpointId: string;
      completed: boolean;
      timeSpent: number;
      quizScore?: number;
      quizPassed?: boolean;
      reflection?: string;
    }) => {
      if (!lesson) throw new Error("No lesson found");
      await apiRequest("POST", `/api/lessons/${lesson.id}/checkpoint-progress`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/progress'] });
    },
  });

  // Tab visibility detection for CE tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
      
      if (lesson?.ce && document.hidden) {
        toast({
          title: "CE Tracking Paused",
          description: "Please keep this tab active for CE credit tracking.",
          variant: "destructive",
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lesson?.ce, toast]);

  // Session timer (only counts when tab is visible for CE lessons)
  useEffect(() => {
    const timer = setInterval(() => {
      if (lesson?.ce && !isTabVisible) {
        return; // Don't count time when tab is not visible for CE lessons
      }
      setTotalSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [lesson?.ce, isTabVisible]);

  // Checkpoint timer
  useEffect(() => {
    if (!lesson || !lesson.checkpoints[currentCheckpointIndex]) return;

    const checkpointId = lesson.checkpoints[currentCheckpointIndex].id;
    const startTime = Date.now();
    checkpointTimerRef.current[checkpointId] = startTime;

    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setCheckpointProgress(prev => ({
        ...prev,
        [checkpointId]: {
          ...prev[checkpointId],
          checkpointId,
          completed: prev[checkpointId]?.completed || false,
          timeSpent: (prev[checkpointId]?.timeSpent || 0) + timeSpent,
          lastAccessed: new Date().toISOString(),
        }
      }));
    };
  }, [currentCheckpointIndex, lesson]);

  // Reading checkpoint timer for minimum time gate
  useEffect(() => {
    const currentCheckpoint = lesson?.checkpoints[currentCheckpointIndex];
    if (currentCheckpoint?.type === 'reading') {
      setReadingStartTime(Date.now());
      setMinimumReadingMet(false);
      
      const timer = setTimeout(() => {
        setMinimumReadingMet(true);
        toast({
          title: "Minimum Reading Time Met",
          description: "You can now proceed to the next section.",
        });
      }, (currentCheckpoint.gate?.value || 300) * 1000); // Default 5 minutes

      return () => clearTimeout(timer);
    }
  }, [currentCheckpointIndex, lesson, toast]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentCheckpoint = (): Checkpoint | null => {
    if (!lesson || !lesson.checkpoints[currentCheckpointIndex]) return null;
    return lesson.checkpoints[currentCheckpointIndex];
  };

  const isCheckpointUnlocked = (index: number): boolean => {
    if (index === 0) return true; // First checkpoint always unlocked
    
    const previousCheckpoint = lesson?.checkpoints[index - 1];
    if (!previousCheckpoint) return false;
    
    const prevProgress = checkpointProgress[previousCheckpoint.id];
    return prevProgress?.completed || false;
  };

  const canProceedFromCurrentCheckpoint = (): boolean => {
    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint) return false;

    const progress = checkpointProgress[checkpoint.id];

    switch (checkpoint.type) {
      case 'reading':
        return minimumReadingMet;
      case 'microquiz':
        return progress?.quizPassed || false;
      case 'reflection':
        return reflection.trim().length >= 50; // Minimum reflection length
      default:
        return true;
    }
  };

  const completeCurrentCheckpoint = async () => {
    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint) return;

    const progressData = {
      checkpointId: checkpoint.id,
      completed: true,
      timeSpent: checkpointProgress[checkpoint.id]?.timeSpent || 0,
    };

    // Add quiz data for microquiz checkpoints
    if (checkpoint.type === 'microquiz' && checkpoint.quiz) {
      const answers = Object.values(quizAnswers);
      const questions = checkpoint.quiz.items;
      let correctAnswers = 0;

      questions.forEach((question, index) => {
        if (answers[index] === question.answerIndex) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= 70;

      Object.assign(progressData, {
        quizScore: score,
        quizPassed: passed,
      });

      if (!passed) {
        toast({
          title: "Quiz Not Passed",
          description: "You need at least 70% to proceed. Please review and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    // Add reflection data
    if (checkpoint.type === 'reflection') {
      Object.assign(progressData, {
        reflection: reflection.trim(),
      });
    }

    try {
      await progressMutation.mutateAsync(progressData);
      
      setCheckpointProgress(prev => ({
        ...prev,
        [checkpoint.id]: {
          ...prev[checkpoint.id],
          ...progressData,
        }
      }));

      toast({
        title: "Checkpoint Completed",
        description: `"${checkpoint.title || checkpoint.type}" has been completed.`,
      });

      // Auto-advance to next checkpoint
      if (currentCheckpointIndex < lesson!.checkpoints.length - 1) {
        setCurrentCheckpointIndex(prev => prev + 1);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setReflection("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save checkpoint progress.",
        variant: "destructive",
      });
    }
  };

  const submitQuiz = () => {
    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint || checkpoint.type !== 'microquiz' || !checkpoint.quiz) return;

    setQuizSubmitted(true);
    completeCurrentCheckpoint();
  };

  const renderCheckpointContent = () => {
    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint) return null;

    switch (checkpoint.type) {
      case 'intro':
        return (
          <Card className="education-card">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h2 className="cinzel text-2xl font-bold mb-4">Welcome to the Lesson</h2>
                <p className="text-muted-foreground mb-6">
                  You're about to begin "{lesson!.title}". This lesson will take approximately {lesson!.estMinutes} minutes to complete.
                </p>
                {lesson!.ce && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-center space-x-2 text-accent">
                      <Award className="w-5 h-5" />
                      <span className="font-semibold">CE Credit Available: {lesson!.ce.hours} hours</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Keep this tab active to track seat time for continuing education credit.
                    </p>
                  </div>
                )}
                <Button onClick={completeCurrentCheckpoint} className="floating-action">
                  Start Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'objectives':
        return (
          <Card className="education-card">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Target className="w-8 h-8 text-primary" />
                <h2 className="cinzel text-2xl font-bold">Learning Objectives</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                {checkpoint.bodyMd ? (
                  <div dangerouslySetInnerHTML={{ __html: checkpoint.bodyMd }} />
                ) : (
                  <p>Upon completion of this lesson, you will be able to understand the key concepts covered.</p>
                )}
              </div>
              <div className="mt-8">
                <Button onClick={completeCurrentCheckpoint} className="floating-action">
                  Continue to Reading
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'reading':
        return (
          <Card className="education-card">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <h2 className="cinzel text-2xl font-bold">Reading Material</h2>
                </div>
                {checkpoint.gate?.type === 'time' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Timer className="w-4 h-4" />
                    <span className={minimumReadingMet ? "text-green-500" : "text-yellow-500"}>
                      Minimum {Math.floor((checkpoint.gate.value || 300) / 60)} min reading
                    </span>
                  </div>
                )}
              </div>
              
              <div className="prose prose-invert max-w-none mb-8">
                {checkpoint.bodyMd ? (
                  <div dangerouslySetInnerHTML={{ __html: checkpoint.bodyMd }} />
                ) : (
                  <p>Reading content will be displayed here.</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {!minimumReadingMet && checkpoint.gate?.type === 'time' && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span>Please spend adequate time reading to proceed</span>
                    </>
                  )}
                </div>
                <Button 
                  onClick={completeCurrentCheckpoint} 
                  disabled={!canProceedFromCurrentCheckpoint()}
                  className="floating-action"
                >
                  {minimumReadingMet ? 'Continue' : 'Reading Required'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'video':
        return (
          <Card className="education-card">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Play className="w-8 h-8 text-primary" />
                <h2 className="cinzel text-2xl font-bold">Video Content</h2>
              </div>
              
              {checkpoint.videoUrl ? (
                <div className="aspect-video bg-black rounded-lg mb-6">
                  <iframe
                    src={checkpoint.videoUrl}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    title="Lesson Video"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Video content will be available here</p>
                  </div>
                </div>
              )}

              <Button onClick={completeCurrentCheckpoint} className="floating-action">
                Continue to Practice
              </Button>
            </CardContent>
          </Card>
        );

      case 'microquiz':
        if (!checkpoint.quiz || !checkpoint.quiz.items.length) {
          return (
            <Card className="education-card">
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No quiz available for this checkpoint.</p>
                <Button onClick={completeCurrentCheckpoint} className="floating-action mt-4">
                  Continue
                </Button>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card className="education-card">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <HelpCircle className="w-8 h-8 text-primary" />
                <h2 className="cinzel text-2xl font-bold">Knowledge Check</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Answer the following questions to test your understanding. You need 70% to proceed.
              </p>

              <div className="space-y-6">
                {checkpoint.quiz.items.map((question, index) => (
                  <Card key={question.id} className="border-muted">
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-4">
                        {index + 1}. {question.stem}
                      </h4>
                      
                      <RadioGroup
                        value={quizAnswers[index]?.toString()}
                        onValueChange={(value) => {
                          setQuizAnswers(prev => ({
                            ...prev,
                            [index]: parseInt(value)
                          }));
                        }}
                        disabled={quizSubmitted}
                      >
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={optionIndex.toString()} 
                              id={`${question.id}-${optionIndex}`}
                            />
                            <Label 
                              htmlFor={`${question.id}-${optionIndex}`}
                              className="cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {quizSubmitted && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <div className={`flex items-center space-x-2 mb-2 ${
                            quizAnswers[index] === question.answerIndex ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {quizAnswers[index] === question.answerIndex ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                            <span className="font-semibold">
                              {quizAnswers[index] === question.answerIndex ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{question.rationale}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {Object.keys(quizAnswers).length} of {checkpoint.quiz.items.length} answered
                </div>
                {!quizSubmitted ? (
                  <Button 
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length !== checkpoint.quiz.items.length}
                    className="floating-action"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    variant="outline"
                    className="border-primary/50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'reflection':
        return (
          <Card className="education-card">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Brain className="w-8 h-8 text-primary" />
                <h2 className="cinzel text-2xl font-bold">Reflection</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Take a moment to reflect on what you've learned. Write at least 50 characters about how you might apply this knowledge.
              </p>

              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Describe your key takeaways and how you plan to apply this knowledge..."
                className="min-h-[150px] mb-4"
              />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {reflection.length} characters (minimum 50 required)
                </div>
                <Button 
                  onClick={completeCurrentCheckpoint}
                  disabled={!canProceedFromCurrentCheckpoint()}
                  className="floating-action"
                >
                  Complete Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'completion':
        return (
          <Card className="education-card">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="cinzel text-2xl font-bold mb-4">Lesson Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Congratulations! You have successfully completed "{lesson!.title}".
              </p>
              
              {lesson!.ce && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-green-500">
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">CE Credit Earned: {lesson!.ce.hours} hours</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
                <div>
                  <span className="block font-semibold">Time Spent</span>
                  <span>{formatTime(totalSessionTime)}</span>
                </div>
                <div>
                  <span className="block font-semibold">Checkpoints</span>
                  <span>{lesson!.checkpoints.length} completed</span>
                </div>
              </div>

              <Button 
                onClick={() => window.history.back()}
                className="floating-action"
              >
                Return to Course
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="education-card">
            <CardContent className="p-8">
              <p className="text-muted-foreground">Checkpoint content not available.</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="elite-skeleton h-32 rounded-2xl"></div>
                <div className="elite-skeleton h-96 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen education-bg">
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen">
          <div className="p-8">
            <div className="max-w-4xl mx-auto text-center">
              <Card className="education-card p-12">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h1 className="cinzel text-3xl font-bold mb-4 text-foreground">Lesson Not Found</h1>
                <p className="text-muted-foreground mb-6">The requested lesson could not be found or has been moved.</p>
                <Button 
                  onClick={() => window.history.back()}
                  className="floating-action px-6 py-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const overallProgress = Math.round((currentCheckpointIndex / lesson.checkpoints.length) * 100);

  return (
    <div className="min-h-screen education-bg">
      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Lesson Header */}
            <Card className="glassmorphism-card border-secondary/30 mb-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.history.back()} 
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Course
                      </Button>
                      <Button
                        onClick={() => setCoachBotOpen(true)}
                        className="floating-action text-background font-semibold"
                        data-testid="button-coach-bot"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Ask CoachBot
                      </Button>
                    </div>
                    <h1 className="cinzel text-3xl font-bold text-shimmer mb-2" data-testid="lesson-title">
                      {lesson.title}
                    </h1>
                    <div className="flex items-center space-x-4">
                      <p className="text-lg text-muted-foreground">
                        {lesson.track} • {lesson.module}
                      </p>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <Clock className="w-3 h-3 mr-1" />
                        {lesson.estMinutes} min
                      </Badge>
                      {lesson.ce && (
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          <Award className="w-3 h-3 mr-1" />
                          {lesson.ce.hours} CE Hours
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="font-semibold text-primary">{overallProgress}%</p>
                    </div>
                    <div className="w-16 h-16 relative">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          stroke="currentColor" 
                          strokeWidth="10" 
                          fill="none" 
                          className="text-muted"
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          stroke="currentColor" 
                          strokeWidth="10" 
                          fill="none" 
                          strokeLinecap="round" 
                          className="text-primary" 
                          strokeDasharray="283" 
                          strokeDashoffset={283 - (283 * overallProgress / 100)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold">{overallProgress}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkpoint Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Lesson Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {currentCheckpointIndex + 1} of {lesson.checkpoints.length}
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>

                {/* Checkpoint Navigation */}
                <div className="flex items-center space-x-2 overflow-x-auto pt-4">
                  {lesson.checkpoints.map((checkpoint, index) => {
                    const isActive = index === currentCheckpointIndex;
                    const isUnlocked = isCheckpointUnlocked(index);
                    const isCompleted = checkpointProgress[checkpoint.id]?.completed;
                    
                    return (
                      <Button
                        key={checkpoint.id}
                        variant="ghost"
                        onClick={() => isUnlocked ? setCurrentCheckpointIndex(index) : null}
                        disabled={!isUnlocked}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                          isActive ? 'bg-primary/20 text-primary border border-primary/30' : 
                          isCompleted ? 'bg-green-500/20 text-green-500' :
                          isUnlocked ? 'hover:bg-muted' : 'opacity-50 cursor-not-allowed'
                        }`}
                        data-testid={`checkpoint-${checkpoint.type}`}
                      >
                        <div className="flex items-center space-x-2">
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isUnlocked ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          <span className="capitalize">{checkpoint.type}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                {/* CE Tracking Status */}
                {lesson.ce && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    isTabVisible ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isTabVisible ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          CE Tracking: {isTabVisible ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Session: {formatTime(totalSessionTime)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checkpoint Content */}
            {renderCheckpointContent()}
          </div>
        </div>
      </main>

      {/* CoachBot Modal */}
      <CoachBotModal
        open={coachBotOpen}
        onClose={() => setCoachBotOpen(false)}
        viewId={`lesson:${lesson.id}:${getCurrentCheckpoint()?.type || 'unknown'}`}
      />
    </div>
  );
}