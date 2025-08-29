import { storage } from "../storage";
import type { QuestionBank, Question, QuizAttempt, InsertQuizAttempt } from "@shared/schema";

export interface ExamQuestion {
  id: string;
  type: string;
  stem: string;
  options: string[];
  difficulty: string;
  topic: string;
  answerKey?: string;
  explanation?: string;
}

export interface ExamSession {
  id: string;
  questions: ExamQuestion[];
  timeLimit: number;
  startTime: Date;
  responses: Record<string, any>;
  currentIndex: number;
  flaggedQuestions: Set<string>;
}

export class ExamService {
  private activeSessions = new Map<string, ExamSession>();

  async startExam(
    userId: string,
    bankId: string
  ): Promise<{
    sessionId: string;
    questions: ExamQuestion[];
    timeLimit: number;
    totalQuestions: number;
  }> {
    // Get question bank
    const bank = await storage.getQuestionBank(bankId);
    if (!bank) {
      throw new Error('Question bank not found');
    }

    // Get all questions for the bank
    const allQuestions = await storage.getQuestionsByBank(bankId);
    if (allQuestions.length === 0) {
      throw new Error('No questions found in this bank');
    }

    // Generate exam questions based on blueprint
    const examQuestions = this.generateExamQuestions(allQuestions, bank);
    
    // Create quiz attempt record
    const attempt = await storage.createQuizAttempt({
      userId,
      bankId,
      totalQuestions: examQuestions.length,
      responses: [],
      completed: false
    });

    // Create exam session
    const session: ExamSession = {
      id: attempt.id,
      questions: examQuestions,
      timeLimit: bank.timeLimitSec || 5400, // Default 90 minutes
      startTime: new Date(),
      responses: {},
      currentIndex: 0,
      flaggedQuestions: new Set()
    };

    this.activeSessions.set(attempt.id, session);

    return {
      sessionId: attempt.id,
      questions: examQuestions.map(q => ({
        ...q,
        // Include answer key and explanation for practice mode
        answerKey: q.answerKey,
        explanation: q.explanation,
        options: q.options
      })),
      timeLimit: session.timeLimit,
      totalQuestions: examQuestions.length
    };
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string | string[]
  ): Promise<{
    success: boolean;
    timeRemaining: number;
    nextQuestionIndex?: number;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Exam session not found');
    }

    // Check if time is up
    const timeElapsed = (Date.now() - session.startTime.getTime()) / 1000;
    if (timeElapsed > session.timeLimit) {
      await this.finishExam(sessionId);
      throw new Error('Time limit exceeded');
    }

    // Record the answer
    session.responses[questionId] = {
      answer,
      timestamp: new Date(),
      timeSpent: timeElapsed
    };

    // Auto-save progress
    await this.saveProgress(sessionId);

    const timeRemaining = session.timeLimit - timeElapsed;
    
    return {
      success: true,
      timeRemaining: Math.max(0, timeRemaining),
      nextQuestionIndex: session.currentIndex + 1
    };
  }

  async flagQuestion(sessionId: string, questionId: string, flagged: boolean): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Exam session not found');
    }

    if (flagged) {
      session.flaggedQuestions.add(questionId);
    } else {
      session.flaggedQuestions.delete(questionId);
    }
  }

  async finishExam(sessionId: string): Promise<{
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
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Exam session not found');
    }

    // Grade the exam
    const results = [];
    let correctAnswers = 0;

    for (const question of session.questions) {
      const userResponse = session.responses[question.id];
      const userAnswer = userResponse?.answer;
      
      // Get the actual question from database for correct answer
      const dbQuestion = await storage.getQuestion(question.id);
      const correctAnswer = dbQuestion?.answerKey || '';
      
      const isCorrect = this.checkAnswer(userAnswer, correctAnswer, dbQuestion?.type || 'mcq');
      if (isCorrect) {
        correctAnswers++;
      }

      results.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer,
        correctAnswer,
        explanation: dbQuestion?.explanation || undefined
      });
    }

    const score = (correctAnswers / session.questions.length) * 100;

    // Update quiz attempt in database
    await storage.updateQuizAttempt(sessionId, {
      score,
      correctAnswers,
      responses: Object.values(session.responses),
      completed: true,
      completedAt: new Date(),
      timeSpent: Math.floor((Date.now() - session.startTime.getTime()) / 1000)
    });

    // Clean up session
    this.activeSessions.delete(sessionId);

    return {
      score,
      correctAnswers,
      totalQuestions: session.questions.length,
      results
    };
  }

  async getExamStatus(sessionId: string): Promise<{
    timeRemaining: number;
    questionsAnswered: number;
    totalQuestions: number;
    flaggedCount: number;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Exam session not found');
    }

    const timeElapsed = (Date.now() - session.startTime.getTime()) / 1000;
    const timeRemaining = Math.max(0, session.timeLimit - timeElapsed);

    return {
      timeRemaining,
      questionsAnswered: Object.keys(session.responses).length,
      totalQuestions: session.questions.length,
      flaggedCount: session.flaggedQuestions.size
    };
  }

  private generateExamQuestions(allQuestions: Question[], bank: QuestionBank): ExamQuestion[] {
    // Implement blueprint-based question selection
    // This is a simplified version - production would use sophisticated algorithms
    
    const blueprint = bank.blueprint as any;
    const targetCounts = blueprint?.topicCounts || {};
    
    let selectedQuestions: Question[] = [];
    
    if (Object.keys(targetCounts).length > 0) {
      // Select questions based on topic quotas
      for (const [topic, count] of Object.entries(targetCounts) as [string, number][]) {
        const topicQuestions = allQuestions.filter(q => 
          q.loTags?.some(tag => tag.toLowerCase().includes(topic.toLowerCase()))
        );
        
        // Shuffle and take required count
        const shuffled = this.shuffleArray([...topicQuestions]);
        selectedQuestions.push(...shuffled.slice(0, count));
      }
    } else {
      // If no blueprint, select random questions up to a limit
      const shuffled = this.shuffleArray([...allQuestions]);
      selectedQuestions = shuffled.slice(0, 50); // Default 50 questions
    }

    // Shuffle final selection if bank allows it
    if (bank.shuffleQuestions) {
      selectedQuestions = this.shuffleArray(selectedQuestions);
    }

    return selectedQuestions.map(q => ({
      id: q.id,
      type: q.type,
      stem: q.stem,
      options: q.options ? (bank.shuffleQuestions ? this.shuffleArray([...q.options]) : q.options) : [],
      difficulty: q.difficulty,
      topic: q.loTags?.[0] || 'General'
    }));
  }

  private checkAnswer(userAnswer: any, correctAnswer: string, questionType: string): boolean {
    if (!userAnswer) return false;

    switch (questionType) {
      case 'mcq':
      case 'tf':
        return userAnswer.toString().toLowerCase() === correctAnswer.toLowerCase();
      
      case 'ms':
        // Multiple select - check if all correct answers are selected
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const correctAnswers = correctAnswer.split(',').map(a => a.trim());
        return userAnswers.length === correctAnswers.length &&
               userAnswers.every(a => correctAnswers.includes(a));
      
      default:
        return userAnswer.toString().toLowerCase() === correctAnswer.toLowerCase();
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async saveProgress(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Update the quiz attempt with current progress
    await storage.updateQuizAttempt(sessionId, {
      responses: Object.values(session.responses)
    });
  }
}

export const examService = new ExamService();
