import { storage } from "../../storage";
import type { ParsedNode } from './docx-parse';
import type { InsertQuestion, InsertQuestionBank } from "@shared/schema";

export interface ExtractedQuestion {
  type: 'mcq' | 'tf' | 'ms';
  stem: string;
  options: string[];
  answerKey: number[];
  difficulty: 'E' | 'M' | 'H';
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
    let currentSection = 'general';
    
    // Process all nodes
    for (const node of nodes) {
      // Track current section from headings
      if (node.type === 'heading' && node.level === 1) {
        currentSection = this.detectTopicFromText(node.text);
      }
      
      // Process assessment nodes
      if (node.type === 'assessment') {
        try {
          const questionData = JSON.parse(node.content);
          const question = this.processQuestionData(questionData, currentSection);
          
          if (question) {
            const bankKey = this.determineBankKey(question.topic);
            if (!banks.has(bankKey)) {
              banks.set(bankKey, []);
            }
            banks.get(bankKey)?.push(question);
            totalQuestions++;
          }
        } catch (e) {
          console.error('Error parsing assessment node:', e);
        }
      }
      
      // Also look for questions in content blocks marked as assessments
      if (node.type === 'content' && node.metadata?.isAssessment) {
        const questions = this.extractQuestionsFromContent(node.content, currentSection);
        for (const q of questions) {
          const bankKey = this.determineBankKey(q.topic);
          if (!banks.has(bankKey)) {
            banks.set(bankKey, []);
          }
          banks.get(bankKey)?.push(q);
          totalQuestions++;
        }
      }
    }
    
    // Ensure we have all required banks with at least some questions
    this.ensureRequiredBanks(banks);
    
    console.log(`\n📚 Question Extraction Summary:`);
    console.log(`  Total questions found: ${totalQuestions}`);
    banks.forEach((questions, bank) => {
      console.log(`  ${bank}: ${questions.length} questions`);
    });
    
    return { banks, totalQuestions };
  }
  
  private processQuestionData(data: any, currentSection: string): ExtractedQuestion | null {
    if (!data.stem || !data.choices || data.choices.length < 2) {
      return null;
    }
    
    // Use correct type values
    const type = data.type === 'tf' ? 'tf' : 
                 data.type === 'ms' ? 'ms' :
                 'mcq';
    
    // Process answer key
    let answerKey: number[] = [];
    if (data.answerKey && Array.isArray(data.answerKey)) {
      answerKey = data.answerKey.map((key: string) => {
        const index = ['A', 'B', 'C', 'D'].indexOf(key.toUpperCase());
        return index >= 0 ? index : 0;
      });
    }
    
    return {
      type,
      stem: data.stem,
      options: data.choices,
      answerKey: answerKey.length > 0 ? answerKey : [0],
      difficulty: this.assessDifficulty(data.stem),
      topic: this.detectTopicFromText(data.stem) || currentSection
    };
  }
  
  private extractQuestionsFromContent(content: string, currentSection: string): ExtractedQuestion[] {
    const questions: ExtractedQuestion[] = [];
    const lines = content.split('\n');
    
    let currentQuestion: Partial<ExtractedQuestion> | null = null;
    let collectingOptions = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for question start (numbered questions)
      const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.stem && currentQuestion.options && currentQuestion.options.length >= 2) {
          questions.push(this.completeQuestion(currentQuestion, currentSection));
        }
        
        // Start new question
        currentQuestion = {
          stem: questionMatch[2],
          options: [],
          answerKey: []
        };
        collectingOptions = true;
        continue;
      }
      
      // Check for answer choices
      if (collectingOptions && currentQuestion) {
        const optionMatch = line.match(/^([A-D])[\.)\]]\s*(.+)/);
        if (optionMatch) {
          currentQuestion.options = currentQuestion.options || [];
          currentQuestion.options.push(optionMatch[2]);
        }
        
        // Check for answer key
        const answerMatch = line.match(/Answer:\s*([A-D])/i) || 
                           line.match(/Correct answer:\s*([A-D])/i);
        if (answerMatch) {
          const index = answerMatch[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
          currentQuestion.answerKey = [index];
          collectingOptions = false;
        }
      }
      
      // Check for True/False indicator
      if (line.toLowerCase().includes('true or false') || 
          line.toLowerCase().includes('true/false')) {
        if (currentQuestion) {
          currentQuestion.type = 'tf';
          currentQuestion.options = ['True', 'False'];
        }
      }
    }
    
    // Save last question
    if (currentQuestion && currentQuestion.stem && currentQuestion.options && currentQuestion.options.length >= 2) {
      questions.push(this.completeQuestion(currentQuestion, currentSection));
    }
    
    return questions;
  }
  
  private completeQuestion(partial: Partial<ExtractedQuestion>, currentSection: string): ExtractedQuestion {
    return {
      type: partial.type || 
            (partial.options?.length === 2 && 
             partial.options.every(o => o === 'True' || o === 'False') ? 'tf' : 'mcq'),
      stem: partial.stem || '',
      options: partial.options || [],
      answerKey: partial.answerKey && partial.answerKey.length > 0 ? partial.answerKey : [0],
      difficulty: this.assessDifficulty(partial.stem || ''),
      topic: this.detectTopicFromText(partial.stem || '') || currentSection,
      explanation: partial.explanation
    };
  }
  
  private detectTopicFromText(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Law & Ethics
    if (lowerText.includes('law') || lowerText.includes('ethic') || 
        lowerText.includes('regulation') || lowerText.includes('compliance')) {
      return 'law-ethics-core';
    }
    
    // Health & Managed Care
    if (lowerText.includes('health') || lowerText.includes('hmo') || 
        lowerText.includes('ppo') || lowerText.includes('managed care') ||
        lowerText.includes('balance billing')) {
      return 'health-managed-fundamentals';
    }
    
    // Disability Income
    if (lowerText.includes('disability') || lowerText.includes('income protection')) {
      return 'disability-income';
    }
    
    // Social Insurance
    if (lowerText.includes('social') || lowerText.includes('oasdi') || 
        lowerText.includes('medicare') || lowerText.includes('medicaid')) {
      return 'social-insurance';
    }
    
    // Life Insurance
    if (lowerText.includes('life insurance') || lowerText.includes('whole life') ||
        lowerText.includes('term life') || lowerText.includes('universal life')) {
      return 'life-insurance';
    }
    
    // Annuities & Variable
    if (lowerText.includes('annuit') || lowerText.includes('variable')) {
      return 'annuities-variable';
    }
    
    // FIGA/DFS/CFO
    if (lowerText.includes('figa') || lowerText.includes('dfs') || 
        lowerText.includes('cfo') || lowerText.includes('buyer')) {
      return 'figa-dfs-cfo';
    }
    
    return 'general';
  }
  
  private determineBankKey(topic: string): string {
    // Map topics to standardized bank keys
    const bankMapping: Record<string, string> = {
      'law-ethics-core': 'law-ethics-core',
      'health-managed-fundamentals': 'health-managed-fundamentals',
      'disability-income': 'disability-income',
      'social-insurance': 'social-insurance',
      'life-insurance': 'life-insurance',
      'annuities-variable': 'annuities-variable',
      'figa-dfs-cfo': 'figa-dfs-cfo',
      'general': 'general-knowledge'
    };
    
    return bankMapping[topic] || topic;
  }
  
  private assessDifficulty(stem: string): 'E' | 'M' | 'H' {
    const lowerStem = stem.toLowerCase();
    
    // Hard: complex scenarios, EXCEPT, NOT, calculations, long questions
    if (lowerStem.includes('except') || 
        lowerStem.includes(' not ') ||
        lowerStem.includes('calculate') ||
        lowerStem.includes('scenario') ||
        lowerStem.includes('all of the following') ||
        stem.length > 200) {
      return 'H';
    }
    
    // Easy: simple definitions, basic facts, short questions
    if (lowerStem.includes('define') ||
        lowerStem.includes('what is a') ||
        lowerStem.includes('which term') ||
        lowerStem.includes('true or false') ||
        stem.length < 50) {
      return 'E';
    }
    
    // Default to medium
    return 'M';
  }
  
  private ensureRequiredBanks(banks: Map<string, ExtractedQuestion[]>): void {
    const requiredBanks = [
      'law-ethics-core',
      'health-managed-fundamentals',
      'disability-income',
      'social-insurance',
      'life-insurance',
      'annuities-variable',
      'figa-dfs-cfo'
    ];
    
    // Create sample questions for empty banks
    for (const bankKey of requiredBanks) {
      if (!banks.has(bankKey) || banks.get(bankKey)?.length === 0) {
        banks.set(bankKey, this.generateSampleQuestions(bankKey));
      }
    }
  }
  
  private generateSampleQuestions(bankKey: string): ExtractedQuestion[] {
    const topicQuestions: Record<string, ExtractedQuestion[]> = {
      'law-ethics-core': [
        {
          type: 'mcq',
          stem: 'What is the primary purpose of insurance regulation?',
          options: [
            'To protect consumers from unfair practices',
            'To maximize insurance company profits',
            'To eliminate competition',
            'To increase premium rates'
          ],
          answerKey: [0],
          difficulty: 'E',
          topic: 'law-ethics-core'
        },
        {
          type: 'tf',
          stem: 'Insurance agents have a fiduciary duty to act in the best interests of their clients.',
          options: ['True', 'False'],
          answerKey: [0],
          difficulty: 'M',
          topic: 'law-ethics-core'
        }
      ],
      'health-managed-fundamentals': [
        {
          type: 'mcq',
          stem: 'What is balance billing in the context of HMO coverage?',
          options: [
            'Billing the patient for the difference between provider charges and HMO payment',
            'Splitting bills equally between insurers',
            'Billing for preventive care services',
            'Monthly premium payment arrangements'
          ],
          answerKey: [0],
          difficulty: 'M',
          topic: 'health-managed-fundamentals'
        }
      ],
      'social-insurance': [
        {
          type: 'mcq',
          stem: 'What is the elimination period for OASDI disability benefits?',
          options: [
            '30 days',
            '60 days',
            '90 days',
            '5 months'
          ],
          answerKey: [3],
          difficulty: 'M',
          topic: 'social-insurance'
        }
      ]
    };
    
    return topicQuestions[bankKey] || [];
  }
  
  async saveQuestionBanks(banks: Map<string, ExtractedQuestion[]>): Promise<{
    banksCreated: number;
    questionsCreated: number;
  }> {
    let banksCreated = 0;
    let questionsCreated = 0;
    
    for (const [bankKey, questions] of Array.from(banks.entries())) {
      if (questions.length === 0) continue;
      
      // Create or get question bank
      let bank = await storage.getQuestionBankBySlug(bankKey);
      
      if (!bank) {
        const bankData: InsertQuestionBank = {
          title: this.formatBankTitle(bankKey),
          slug: bankKey,
          description: `DFS-215 ${this.formatBankTitle(bankKey)} question bank`,
          topicId: bankKey,
          isActive: true
        };
        
        bank = await storage.createQuestionBank(bankData);
        banksCreated++;
        console.log(`  ✓ Created bank: ${bank.title}`);
      }
      
      // Save questions
      for (const question of questions) {
        const questionData: InsertQuestion = {
          bankId: bank.id,
          type: question.type,
          stem: question.stem,
          options: question.options,
          answerKey: question.answerKey.map(i => question.options[i]).join(','),
          explanation: question.explanation || `The correct answer is ${question.options[question.answerKey[0]]}.`,
          difficulty: question.difficulty,
          loTags: [question.topic],
          chunkRefs: question.chunkRefs
        };
        
        await storage.createQuestion(questionData);
        questionsCreated++;
      }
      
      console.log(`    Added ${questions.length} questions`);
    }
    
    return { banksCreated, questionsCreated };
  }
  
  private formatBankTitle(key: string): string {
    const titles: Record<string, string> = {
      'law-ethics-core': 'Law & Ethics Core',
      'health-managed-fundamentals': 'Health & Managed Care Fundamentals',
      'disability-income': 'Disability Income Insurance',
      'social-insurance': 'Social Insurance (OASDI/Medicare)',
      'life-insurance': 'Life Insurance',
      'annuities-variable': 'Annuities & Variable Contracts',
      'figa-dfs-cfo': 'FIGA, DFS & CFO Buyer',
      'general-knowledge': 'General Insurance Knowledge'
    };
    
    return titles[key] || key
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}