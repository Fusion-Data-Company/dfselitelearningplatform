import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import SimpleFlashCard from "@/components/SimpleFlashCard";
import { useToast } from "@/hooks/use-toast";
import { Layers3 } from "lucide-react";

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
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { toast } = useToast();

  const { data: flashcards = [], isLoading: cardsLoading } = useQuery<Flashcard[]>({
    queryKey: ['/api/iflash/cards'],
  });

  // Placeholder flashcards for demonstration when no real cards are loaded
  const placeholderCards: Flashcard[] = [
    {
      id: 'demo-1',
      type: 'basic',
      front: 'What does HMO stand for?',
      back: 'Health Maintenance Organization - A type of managed care plan that provides healthcare services through a network of doctors and hospitals.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-2', 
      type: 'basic',
      front: 'What is the primary purpose of Florida DFS regulation?',
      back: 'To protect consumers by ensuring insurance companies operate fairly, maintain adequate reserves, and comply with state insurance laws.',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-3',
      type: 'multiple_choice',
      prompt: 'Which of the following is NOT a type of managed care organization?',
      options: ['HMO', 'PPO', 'EPO', 'FFS'],
      answerIndex: 3,
      rationale: 'FFS (Fee-For-Service) is a traditional payment model, not a managed care organization. HMO, PPO, and EPO are all types of managed care.',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-4',
      type: 'basic',
      front: 'What does PPO stand for and what is its main characteristic?',
      back: 'Preferred Provider Organization - Allows members to see out-of-network providers but at higher cost, offering more flexibility than HMOs.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-5',
      type: 'basic',
      front: 'What is HIPAA and why is it important in healthcare?',
      back: 'Health Insurance Portability and Accountability Act - Protects patient privacy and ensures confidentiality of medical information.',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-6',
      type: 'multiple_choice',
      prompt: 'What is the minimum continuing education requirement for Florida insurance agents?',
      options: ['20 hours every 2 years', '24 hours every 2 years', '30 hours every 2 years', '40 hours every 2 years'],
      answerIndex: 1,
      rationale: '24 hours every 2 years is the standard CE requirement, including specific ethics and law components.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-7',
      type: 'basic',
      front: 'What is the difference between Medicare Part A and Part B?',
      back: 'Part A covers hospital insurance (inpatient care), while Part B covers medical insurance (outpatient care, doctor visits, preventive services).',
      difficulty: 2,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-8',
      type: 'basic',
      front: 'What does "grandfathered plan" mean under the ACA?',
      back: 'Health plans that existed before March 23, 2010, and have maintained certain characteristics, exempt from some ACA requirements.',
      difficulty: 3,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-9',
      type: 'multiple_choice',
      prompt: 'Which entity regulates insurance in Florida?',
      options: ['Florida Department of Health', 'Florida Department of Financial Services', 'Florida Insurance Commission', 'Florida Department of Commerce'],
      answerIndex: 1,
      rationale: 'The Florida Department of Financial Services (DFS) regulates insurance companies and agents in Florida.',
      difficulty: 1,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    },
    {
      id: 'demo-10',
      type: 'basic',
      front: 'What is an Essential Health Benefit under the ACA?',
      back: 'Required coverage categories including ambulatory care, emergency services, hospitalization, maternity care, mental health, prescription drugs, preventive care, pediatric services, rehabilitation, and laboratory services.',
      difficulty: 3,
      interval: 1,
      reviewCount: 0,
      nextReview: new Date().toISOString()
    }
  ];

  // Use real flashcards if available, otherwise use placeholders
  const activeCards = flashcards.length > 0 ? flashcards : placeholderCards;

  const handleCorrect = () => {
    if (currentCardIndex < activeCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setCurrentCardIndex(0);
      toast({
        title: "Session Complete!",
        description: `You reviewed ${activeCards.length} cards. Great work!`,
      });
    }
  };

  const handleIncorrect = () => {
    if (currentCardIndex < activeCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setCurrentCardIndex(0);
      toast({
        title: "Session Complete!",
        description: `You reviewed ${activeCards.length} cards. Keep practicing!`,
      });
    }
  };

  if (cardsLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(/iflash-bg.jpg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        />
        
        <Navigation />
        <Sidebar />
        <main className="ml-96 pt-16 min-h-screen relative z-10">
          <div className="p-8">
            <div className="max-w-3xl mx-auto text-center">
              <Layers3 className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
              <h2 className="cinzel text-3xl font-bold mb-2">Loading...</h2>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: `url(/iflash-bg.jpg)`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}
      />
      
      <Navigation />
      <Sidebar />
      
      <main className="ml-96 pt-16 min-h-screen relative z-10">
        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="cinzel text-4xl font-bold mb-2">iFlash</h1>
              <p className="text-muted-foreground">Simple flashcard review</p>
            </div>

            <SimpleFlashCard
              card={activeCards[currentCardIndex]}
              onCorrect={handleCorrect}
              onIncorrect={handleIncorrect}
              cardNumber={currentCardIndex + 1}
              totalCards={activeCards.length}
            />
          </div>
        </div>
      </main>
    </div>
  );
}