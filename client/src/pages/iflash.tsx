import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Layers3, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  Target,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
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
  nextReview: string;
}

export default function IFlashPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();

  const { data: flashcards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: ['/api/iflash/cards'],
  });

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;
  const isMCQ = currentCard?.type === 'mcq' || currentCard?.options?.length > 0;

  const handleOptionSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    
    const isCorrect = index === currentCard?.answerIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
      setStreak(0);
    }
  };

  const handleFlip = () => {
    if (!isMCQ) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      // Session complete
      toast({
        title: "🎉 Session Complete!",
        description: `Score: ${correctCount}/${correctCount + incorrectCount} correct. ${streak > 3 ? `Amazing ${streak} card streak!` : ''}`,
      });
      // Reset for another round
      setCurrentIndex(0);
      setIsFlipped(false);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const handleMarkCorrect = () => {
    setCorrectCount(prev => prev + 1);
    setStreak(prev => prev + 1);
    handleNext();
  };

  const handleMarkIncorrect = () => {
    setIncorrectCount(prev => prev + 1);
    setStreak(0);
    handleNext();
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedOption(null);
    setShowResult(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setStreak(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Navigation />
        <Sidebar />
        <main className="ml-64 pt-16 min-h-screen flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-20 h-20 mx-auto text-indigo-400" />
            </motion.div>
            <h2 className="mt-6 text-2xl font-bold text-white">Loading Flashcards...</h2>
            <p className="text-slate-400 mt-2">Preparing your study session</p>
          </motion.div>
        </main>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Navigation />
        <Sidebar />
        <main className="ml-64 pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <Layers3 className="w-20 h-20 mx-auto text-slate-600 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Flashcards Available</h2>
            <p className="text-slate-400">Complete some lessons to generate flashcards for review.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <Navigation />
      <Sidebar />
      
      <main className="ml-64 pt-16 min-h-screen relative z-10">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header with Stats */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-10 h-10 text-amber-400" />
                  iFlash Review
                </h1>
                <p className="text-slate-400 mt-1">DFS-215 Exam Preparation</p>
              </div>
              
              <div className="flex items-center gap-4">
                {streak >= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2"
                  >
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-400 font-bold">{streak} Streak!</span>
                  </motion.div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSession}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Card {currentIndex + 1} of {flashcards.length}</span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {correctCount}
                  </span>
                  <span className="text-red-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {incorrectCount}
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2 bg-slate-800" />
            </div>
          </div>

          {/* Flashcard */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {isMCQ ? (
                // MCQ Card
                <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden">
                  <div className="p-8">
                    {/* Question */}
                    <div className="mb-8">
                      <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        Multiple Choice
                      </Badge>
                      <h2 className="text-2xl font-semibold text-white leading-relaxed">
                        {currentCard?.prompt || currentCard?.front}
                      </h2>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      {currentCard?.options?.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const isCorrect = index === currentCard?.answerIndex;
                        const showCorrectness = showResult;
                        
                        return (
                          <motion.button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            disabled={showResult}
                            whileHover={!showResult ? { scale: 1.01 } : {}}
                            whileTap={!showResult ? { scale: 0.99 } : {}}
                            className={cn(
                              "w-full p-5 rounded-xl text-left transition-all duration-300 border-2",
                              !showResult && "hover:bg-slate-800/50 border-slate-700/50 bg-slate-800/30",
                              showCorrectness && isCorrect && "border-emerald-500 bg-emerald-500/20",
                              showCorrectness && isSelected && !isCorrect && "border-red-500 bg-red-500/20",
                              showCorrectness && !isSelected && !isCorrect && "border-slate-700/30 opacity-50"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <span className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                                !showResult && "bg-slate-700 text-slate-300",
                                showCorrectness && isCorrect && "bg-emerald-500 text-white",
                                showCorrectness && isSelected && !isCorrect && "bg-red-500 text-white"
                              )}>
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className={cn(
                                "text-lg pt-1.5",
                                showCorrectness && isCorrect ? "text-emerald-200" : "text-slate-200"
                              )}>
                                {option}
                              </span>
                              {showCorrectness && isCorrect && (
                                <CheckCircle2 className="w-6 h-6 text-emerald-400 ml-auto flex-shrink-0" />
                              )}
                              {showCorrectness && isSelected && !isCorrect && (
                                <XCircle className="w-6 h-6 text-red-400 ml-auto flex-shrink-0" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Rationale */}
                    {showResult && currentCard?.rationale && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-xl bg-slate-800/50 border border-slate-700/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-amber-400" />
                          <span className="font-semibold text-amber-400">Explanation</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{currentCard.rationale}</p>
                      </motion.div>
                    )}
                  </div>
                </Card>
              ) : (
                // Basic Flashcard (flip style)
                <div 
                  className="perspective-1000 cursor-pointer"
                  onClick={handleFlip}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                    className="relative preserve-3d"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Front */}
                    <Card 
                      className={cn(
                        "bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl p-12 min-h-[400px] flex flex-col items-center justify-center text-center backface-hidden",
                        isFlipped && "invisible"
                      )}
                    >
                      <Badge className="mb-6 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                        Question
                      </Badge>
                      <h2 className="text-2xl font-semibold text-white leading-relaxed">
                        {currentCard?.front || currentCard?.prompt}
                      </h2>
                      <p className="text-slate-500 mt-8 text-sm">Click to reveal answer</p>
                    </Card>

                    {/* Back */}
                    <Card 
                      className={cn(
                        "bg-slate-900/80 backdrop-blur-xl border-emerald-700/50 shadow-2xl p-12 min-h-[400px] flex flex-col items-center justify-center text-center absolute inset-0 backface-hidden",
                        !isFlipped && "invisible"
                      )}
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        Answer
                      </Badge>
                      <p className="text-xl text-slate-200 leading-relaxed">
                        {currentCard?.back || currentCard?.rationale}
                      </p>
                    </Card>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            {!isMCQ && isFlipped && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleMarkIncorrect}
                  variant="outline"
                  className="border-red-700 text-red-400 hover:bg-red-950"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Needs Review
                </Button>
                <Button
                  onClick={handleMarkCorrect}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Got It!
                </Button>
              </div>
            )}

            {(isMCQ && showResult) && (
              <Button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Next Card
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}

            {!isMCQ && !isFlipped && (
              <Button
                onClick={handleNext}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Skip
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}

            {isMCQ && !showResult && (
              <div className="text-slate-500 text-sm">Select an answer above</div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
