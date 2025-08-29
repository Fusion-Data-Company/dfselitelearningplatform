import { storage } from "../../storage";
import type { ParsedNode } from './docx-parse';
import type { InsertQuestion, InsertQuestionBank } from "@shared/schema";

export interface ExtractedQuestion {
  type: 'multiple-choice' | 'true-false' | 'multiple-select';
  stem: string;
  options: string[];
  answerKey: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  explanation?: string;
  chunkRefs?: string[];
}

export class QuestionExtractor {
  async extractQuestions(nodes: ParsedNode[]): Promise<{
    banks: Map<string, ExtractedQuestion[]>;
    totalQuestions: number;
  }> {
    const banks = new Map<string, ExtractedQuestion[]>();
    let totalQuestions = 0;
    let currentBank = 'general';
    let currentQuestion: Partial<ExtractedQuestion> | null = null;
    let collectingOptions = false;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      // Detect quiz/exam sections
      if (node.type === 'heading' && this.isAssessmentSection(node.text)) {
        currentBank = this.generateBankKey(node.text);
        if (!banks.has(currentBank)) {
          banks.set(currentBank, []);
        }
        continue;
      }
      
      // Detect question stems
      if (node.type === 'question' || this.isQuestionStem(node.text)) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.stem && currentQuestion.options) {
          const completed = this.completeQuestion(currentQuestion);
          if (completed) {
            banks.get(currentBank)?.push(completed);
            totalQuestions++;
          }
        }
        
        // Start new question
        currentQuestion = {
          stem: this.cleanQuestionStem(node.text),
          options: [],
          answerKey: [],
          topic: currentBank,
          type: 'multiple-choice'
        };
        collectingOptions = true;
        continue;
      }
      
      // Collect options
      if (collectingOptions && currentQuestion && node.type === 'content') {
        const option = this.extractOption(node.text);
        if (option) {
          currentQuestion.options?.push(option.text);
          if (option.isCorrect) {
            currentQuestion.answerKey?.push(currentQuestion.options.length - 1);
          }
        }
        
        // Check if this is an answer line
        const answer = this.extractAnswer(node.text);
        if (answer !== null && currentQuestion.options) {
          currentQuestion.answerKey = [answer];
          collectingOptions = false;
        }
      }
      
      // Detect True/False questions
      if (node.text.toLowerCase().includes('true or false') || 
          node.text.toLowerCase().includes('true/false')) {
        currentQuestion = {
          ...currentQuestion,
          type: 'true-false',
          options: ['True', 'False']
        };
      }
    }
    
    // Save last question if exists
    if (currentQuestion && currentQuestion.stem && currentQuestion.options) {
      const completed = this.completeQuestion(currentQuestion);
      if (completed) {
        banks.get(currentBank)?.push(completed);
        totalQuestions++;
      }
    }
    
    return { banks, totalQuestions };
  }
  
  private isAssessmentSection(text: string): boolean {
    const lowerText = text.toLowerCase();
    return (
      lowerText.includes('quiz') ||
      lowerText.includes('exam') ||
      lowerText.includes('review questions') ||
      lowerText.includes('self-test') ||
      lowerText.includes('practice')
    );
  }
  
  private generateBankKey(text: string): string {
    const cleaned = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Map to standardized bank names
    if (cleaned.includes('law') || cleaned.includes('ethics')) {
      return 'law-ethics-core';
    }
    if (cleaned.includes('health') || cleaned.includes('managed')) {
      return 'health-managed-fundamentals';
    }
    if (cleaned.includes('disability')) {
      return 'disability-income';
    }
    if (cleaned.includes('life')) {
      return 'life-insurance';
    }
    if (cleaned.includes('annuit')) {
      return 'annuities-variable';
    }
    if (cleaned.includes('social') || cleaned.includes('oasdi')) {
      return 'social-insurance';
    }
    if (cleaned.includes('figa') || cleaned.includes('dfs')) {
      return 'figa-dfs-cfo';
    }
    
    return cleaned.substring(0, 50);
  }
  
  private isQuestionStem(text: string): boolean {
    return !!(
      text.match(/^\s*\d+[\.\)]\s+\w+/) ||
      text.match(/^Q\d+:/) ||
      text.includes('Which of the following') ||
      text.includes('What is') ||
      text.includes('What are') ||
      text.includes('How do') ||
      text.includes('When should') ||
      text.includes('True or False')
    );
  }
  
  private cleanQuestionStem(text: string): string {
    return text
      .replace(/^\s*\d+[\.\)]\s+/, '') // Remove numbering
      .replace(/^Q\d+:\s*/, '') // Remove Q1: format
      .trim();
  }
  
  private extractOption(text: string): { text: string; isCorrect: boolean } | null {
    const optionMatch = text.match(/^\s*([A-D])[\)\.\:]\s+(.+)/i);
    if (optionMatch) {
      return {
        text: optionMatch[2].trim(),
        isCorrect: false // Will be set based on answer key
      };
    }
    return null;
  }
  
  private extractAnswer(text: string): number | null {
    const answerMatch = text.match(/^\s*Answer\s*[:\-]\s*([A-D])\b/i) ||
                       text.match(/^\s*Correct\s*[:\-]\s*([A-D])\b/i);
    
    if (answerMatch) {
      const letter = answerMatch[1].toUpperCase();
      return letter.charCodeAt(0) - 'A'.charCodeAt(0);
    }
    
    return null;
  }
  
  private completeQuestion(partial: Partial<ExtractedQuestion>): ExtractedQuestion | null {
    if (!partial.stem || !partial.options || partial.options.length < 2) {
      return null;
    }
    
    // Determine difficulty based on content
    const difficulty = this.assessDifficulty(partial.stem);
    
    // Ensure answer key is set
    if (!partial.answerKey || partial.answerKey.length === 0) {
      // Default to first option if no answer found
      partial.answerKey = [0];
    }
    
    // Determine question type
    const type = partial.type || (
      partial.answerKey.length > 1 ? 'multiple-select' : 
      partial.options.length === 2 && 
        partial.options.includes('True') && 
        partial.options.includes('False') ? 'true-false' :
      'multiple-choice'
    );
    
    return {
      type,
      stem: partial.stem,
      options: partial.options,
      answerKey: partial.answerKey,
      difficulty,
      topic: partial.topic || 'general',
      explanation: partial.explanation
    };
  }
  
  private assessDifficulty(stem: string): 'easy' | 'medium' | 'hard' {
    const lowerStem = stem.toLowerCase();
    
    // Hard: complex scenarios, EXCEPT, NOT, calculations
    if (lowerStem.includes('except') || 
        lowerStem.includes('not') ||
        lowerStem.includes('calculate') ||
        lowerStem.includes('scenario') ||
        stem.length > 200) {
      return 'hard';
    }
    
    // Easy: simple definitions, basic facts
    if (lowerStem.includes('define') ||
        lowerStem.includes('what is') ||
        lowerStem.includes('which term') ||
        stem.length < 50) {
      return 'easy';
    }
    
    // Default to medium
    return 'medium';
  }
  
  async saveQuestionBanks(banks: Map<string, ExtractedQuestion[]>): Promise<{
    banksCreated: number;
    questionsCreated: number;
  }> {
    let banksCreated = 0;
    let questionsCreated = 0;
    
    for (const [bankKey, questions] of banks.entries()) {
      if (questions.length === 0) continue;
      
      // Create or get question bank
      let bank = await storage.getQuestionBankBySlug(bankKey);
      
      if (!bank) {
        const bankData: InsertQuestionBank = {
          title: this.formatBankTitle(bankKey),
          slug: bankKey,
          description: `Question bank for ${this.formatBankTitle(bankKey)}`,
          topicId: bankKey,
          isActive: true
        };
        
        bank = await storage.createQuestionBank(bankData);
        banksCreated++;
        console.log(`Created question bank: ${bank.title}`);
      }
      
      // Save questions
      for (const question of questions) {
        const questionData: InsertQuestion = {
          bankId: bank.id,
          type: question.type,
          stem: question.stem,
          options: question.options,
          correctAnswers: question.answerKey,
          explanation: question.explanation || '',
          difficulty: question.difficulty,
          tags: [question.topic],
          isActive: true
        };
        
        await storage.createQuestion(questionData);
        questionsCreated++;
      }
      
      console.log(`  Added ${questions.length} questions to ${bank.title}`);
    }
    
    return { banksCreated, questionsCreated };
  }
  
  private formatBankTitle(key: string): string {
    return key
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}