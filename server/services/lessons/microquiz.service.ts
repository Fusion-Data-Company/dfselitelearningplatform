import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { lessons, lessonCheckpoints } from "../../../../../shared/schema";
import type { QuizItem } from "../../../../../shared/schemas/lesson";
import { checkpointsService } from "./checkpoints.service";

interface MicroquizExtraction {
  questions: QuizItem[];
  totalQuestions: number;
}

export class MicroquizService {
  /**
   * Extract microquiz questions from lesson content specifically for checkpoint use
   */
  extractMicroquizFromLesson(content: string, lessonTitle: string): MicroquizExtraction {
    const questions: QuizItem[] = [];
    const sections = this.findQuizSections(content);
    
    for (const section of sections) {
      const extractedQuestions = this.parseQuestionSection(section);
      questions.push(...extractedQuestions);
    }
    
    // If no questions found, create fallback questions
    if (questions.length === 0) {
      questions.push(...this.createFallbackQuestions(lessonTitle));
    }
    
    // Limit to 5-10 questions for microquiz (optimal for checkpoint)
    const finalQuestions = questions.slice(0, 8);
    
    return {
      questions: finalQuestions,
      totalQuestions: finalQuestions.length
    };
  }

  /**
   * Find sections that contain quiz content from lesson text
   */
  private findQuizSections(content: string): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let inQuizSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for quiz section headers (any heading level)
      if (trimmed.match(/^#{1,6}\s+/)) {
        // Save previous section if it was a quiz section
        if (inQuizSection && currentSection.length > 50) {
          sections.push(currentSection);
        }
        
        // Check if this is a quiz section
        const headerText = trimmed.replace(/^#+\s+/, '').toLowerCase();
        inQuizSection = this.isQuizHeader(headerText);
        currentSection = inQuizSection ? line + '\n' : '';
      } else if (inQuizSection) {
        currentSection += line + '\n';
      }
    }
    
    // Add final section if it was a quiz section
    if (inQuizSection && currentSection.length > 50) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Check if a header indicates a quiz section
   */
  private isQuizHeader(headerText: string): boolean {
    const quizPatterns = [
      /quiz/i,
      /review\s+questions?/i,
      /self[\-\s]?test/i,
      /practice\s+questions?/i,
      /knowledge\s+check/i,
      /assessment/i,
      /checkpoint\s+questions?/i,
      /test\s+your\s+understanding/i,
      /quick\s+check/i,
      /comprehension\s+check/i
    ];
    
    return quizPatterns.some(pattern => pattern.test(headerText));
  }

  /**
   * Parse individual question section to extract questions
   */
  private parseQuestionSection(section: string): QuizItem[] {
    const questions: QuizItem[] = [];
    const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion: {
      stem?: string;
      options: string[];
      answerIndex?: number;
      type: 'mcq' | 'tf';
      rationale?: string;
    } | null = null;
    
    for (const line of lines) {
      // Skip header lines
      if (line.match(/^#+\s+/)) {
        continue;
      }
      
      // Check for question stem (numbered questions)
      const stemMatch = line.match(/^\s*(\d+)[\.\)]\s+(.+)$/);
      if (stemMatch) {
        // Save previous question if valid
        if (currentQuestion && this.isValidQuestionData(currentQuestion)) {
          questions.push(this.createQuizItem(currentQuestion));
        }
        
        // Start new question
        currentQuestion = {
          stem: stemMatch[2].trim(),
          options: [],
          type: 'mcq' // Default to MCQ
        };
        continue;
      }
      
      // Check for answer options (A-D format)
      const optionMatch = line.match(/^\s*([A-D])[\)\.\:]\s+(.+)$/i);
      if (optionMatch && currentQuestion) {
        currentQuestion.options.push(optionMatch[2].trim());
        
        // Detect if this is a True/False question
        const optionText = optionMatch[2].trim().toLowerCase();
        if (currentQuestion.options.length <= 2 && 
            (optionText === 'true' || optionText === 'false')) {
          currentQuestion.type = 'tf';
        }
        continue;
      }
      
      // Check for True/False format without A/B labels
      if (currentQuestion && currentQuestion.options.length === 0) {
        const tfMatch = line.match(/^\s*(true|false)\s*$/i);
        if (tfMatch) {
          currentQuestion.type = 'tf';
          currentQuestion.options = ['True', 'False'];
          // Assume the question stem contains the correct answer context
          currentQuestion.answerIndex = 0; // Will be refined by answer key if found
          continue;
        }
      }
      
      // Check for answer key
      const answerMatch = line.match(/^\s*(Answer|Correct|Key)\s*[:\-]\s*([A-D]|true|false)\b/i);
      if (answerMatch && currentQuestion) {
        const answerText = answerMatch[2].toLowerCase();
        
        if (currentQuestion.type === 'tf') {
          currentQuestion.answerIndex = answerText === 'true' ? 0 : 1;
        } else {
          // Map A-D to 0-3
          const letterMap: { [key: string]: number } = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
          currentQuestion.answerIndex = letterMap[answerText] ?? 0;
        }
        continue;
      }
      
      // Check for explanation/rationale (non-structural lines after answer)
      if (currentQuestion && currentQuestion.answerIndex !== undefined &&
          line.length > 20 && 
          !line.match(/^\d+[\.\)]/) && 
          !line.match(/^[A-D][\)\.\:]/i) &&
          !line.match(/^(Answer|Correct|Key)/i)) {
        currentQuestion.rationale = line;
      }
    }
    
    // Add final question
    if (currentQuestion && this.isValidQuestionData(currentQuestion)) {
      questions.push(this.createQuizItem(currentQuestion));
    }
    
    return questions;
  }

  /**
   * Validate question data before creating QuizItem
   */
  private isValidQuestionData(data: any): boolean {
    return !!(
      data.stem && 
      data.options && 
      data.options.length >= 2 && 
      data.answerIndex !== undefined &&
      data.answerIndex >= 0 &&
      data.answerIndex < data.options.length
    );
  }

  /**
   * Create QuizItem from parsed question data
   */
  private createQuizItem(data: any): QuizItem {
    return {
      id: this.generateQuestionId(),
      type: data.type,
      stem: data.stem,
      options: data.options,
      answerIndex: data.answerIndex,
      rationale: data.rationale || `The correct answer is "${data.options[data.answerIndex]}".`
    };
  }

  /**
   * Generate unique question ID
   */
  private generateQuestionId(): string {
    return `mq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create fallback questions when none found in content
   */
  private createFallbackQuestions(lessonTitle: string): QuizItem[] {
    return [
      {
        id: this.generateQuestionId(),
        type: 'mcq',
        stem: `What is the primary focus of "${lessonTitle}"?`,
        options: [
          'Understanding key concepts and applications',
          'Memorizing regulatory details only',
          'Historical background information',
          'Advanced mathematical calculations'
        ],
        answerIndex: 0,
        rationale: 'The lesson focuses on helping you understand and apply key concepts.'
      },
      {
        id: this.generateQuestionId(),
        type: 'tf',
        stem: `The material covered in "${lessonTitle}" is relevant to professional practice.`,
        options: ['True', 'False'],
        answerIndex: 0,
        rationale: 'All lesson content is designed to be practical and applicable to professional scenarios.'
      },
      {
        id: this.generateQuestionId(),
        type: 'mcq',
        stem: 'Which study approach is most effective for mastering this material?',
        options: [
          'Active reading and application of concepts',
          'Passive reading without engagement',
          'Skipping directly to assessments',
          'Memorizing text verbatim'
        ],
        answerIndex: 0,
        rationale: 'Active engagement with the material through reading and practical application leads to better understanding and retention.'
      },
      {
        id: this.generateQuestionId(),
        type: 'mcq',
        stem: 'What should you do if you need clarification on a concept from this lesson?',
        options: [
          'Review the material and use additional resources',
          'Skip the concept and move forward',
          'Assume it will be explained later',
          'Focus only on memorizing the definition'
        ],
        answerIndex: 0,
        rationale: 'When you need clarification, the best approach is to review the material thoroughly and seek additional resources for better understanding.'
      }
    ];
  }

  /**
   * Process a lesson and update its microquiz checkpoint with extracted questions
   */
  async processLessonMicroquiz(lessonId: string): Promise<void> {
    // Get lesson data
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
      
    if (!lesson.length) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }
    
    const lessonData = lesson[0];
    const content = lessonData.content || '';
    
    // Extract questions from lesson content
    const extraction = this.extractMicroquizFromLesson(content, lessonData.title);
    
    if (extraction.questions.length === 0) {
      console.log(`⚠️  No questions found for lesson: ${lessonData.title}`);
      return;
    }
    
    // Create quiz data structure for checkpoint
    const quizData = {
      items: extraction.questions
    };
    
    // Update the microquiz checkpoint
    await checkpointsService.updateMicroquizCheckpoint(lessonId, quizData);
    
    console.log(`✓ Updated microquiz checkpoint for "${lessonData.title}" with ${extraction.totalQuestions} questions`);
  }

  /**
   * Batch process multiple lessons for microquiz generation
   */
  async batchProcessLessons(lessonIds: string[]): Promise<{
    processed: number;
    failed: string[];
  }> {
    let processed = 0;
    const failed: string[] = [];
    
    for (const lessonId of lessonIds) {
      try {
        await this.processLessonMicroquiz(lessonId);
        processed++;
      } catch (error) {
        console.error(`Failed to process microquiz for lesson ${lessonId}:`, error);
        failed.push(lessonId);
      }
    }
    
    return { processed, failed };
  }

  /**
   * Get microquiz data for a specific lesson
   */
  async getMicroquizByLesson(lessonId: string): Promise<QuizItem[] | null> {
    const checkpoint = await db.select()
      .from(lessonCheckpoints)
      .where(and(
        eq(lessonCheckpoints.lessonId, lessonId),
        eq(lessonCheckpoints.type, 'microquiz')
      ))
      .limit(1);
      
    if (!checkpoint.length || !checkpoint[0].quiz) {
      return null;
    }
    
    const quizData = checkpoint[0].quiz as any;
    return quizData.items || [];
  }

  /**
   * Validate microquiz answers and return score
   */
  validateQuizAnswers(questions: QuizItem[], answers: number[]): {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    details: Array<{
      questionId: string;
      correct: boolean;
      userAnswer: number;
      correctAnswer: number;
    }>;
  } {
    const details: Array<{
      questionId: string;
      correct: boolean;
      userAnswer: number;
      correctAnswer: number;
    }> = [];
    
    let correctAnswers = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      const isCorrect = userAnswer === question.answerIndex;
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      details.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer,
        correctAnswer: question.answerIndex
      });
    }
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70; // 70% passing threshold
    
    return {
      score,
      totalQuestions: questions.length,
      correctAnswers,
      passed,
      details
    };
  }
}

export const microquizService = new MicroquizService();