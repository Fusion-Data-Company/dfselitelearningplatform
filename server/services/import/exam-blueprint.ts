import { storage } from "../../storage";
import type { InsertExamConfig, InsertExamSession } from "@shared/schema";

export interface ExamBlueprint {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  passingScore: number;
  topicWeights: Map<string, number>;
  difficultyMix: {
    easy: number;
    medium: number;
    hard: number;
  };
  rules: {
    shuffle: boolean;
    oneSubmit: boolean;
    proctor: boolean;
    showResults: boolean;
  };
}

export class ExamBlueprintBuilder {
  private readonly defaultBlueprint: ExamBlueprint = {
    id: 'dfs-215-sim',
    title: 'DFS-215 Certification Exam Simulator',
    description: 'Full 50-question practice exam covering all DFS-215 topics',
    duration: 3600, // 60 minutes
    passingScore: 70,
    topicWeights: new Map([
      ['law-ethics-core', 8],
      ['health-managed-fundamentals', 12],
      ['disability-income', 6],
      ['social-insurance', 8],
      ['life-insurance', 10],
      ['annuities-variable', 4],
      ['figa-dfs-cfo', 2]
    ]),
    difficultyMix: {
      easy: 40,
      medium: 45,
      hard: 15
    },
    rules: {
      shuffle: true,
      oneSubmit: true,
      proctor: true,
      showResults: true
    }
  };
  
  async buildExamForm(blueprint?: Partial<ExamBlueprint>): Promise<{
    config: InsertExamConfig;
    questionIds: string[];
  }> {
    const finalBlueprint = { ...this.defaultBlueprint, ...blueprint };
    const selectedQuestions: string[] = [];
    
    // Calculate total questions needed
    const totalQuestions = Array.from(finalBlueprint.topicWeights.values())
      .reduce((sum, weight) => sum + weight, 0);
    
    // Select questions per topic based on weights
    for (const [topicId, weight] of finalBlueprint.topicWeights.entries()) {
      const bank = await storage.getQuestionBankBySlug(topicId);
      if (!bank) {
        console.warn(`Question bank not found for topic: ${topicId}`);
        continue;
      }
      
      const questions = await storage.getQuestionsByBank(bank.id);
      
      // Calculate questions needed per difficulty
      const easyCount = Math.floor(weight * finalBlueprint.difficultyMix.easy / 100);
      const mediumCount = Math.floor(weight * finalBlueprint.difficultyMix.medium / 100);
      const hardCount = weight - easyCount - mediumCount;
      
      // Select questions by difficulty
      const easyQuestions = questions
        .filter(q => q.difficulty === 'easy')
        .slice(0, easyCount)
        .map(q => q.id);
      
      const mediumQuestions = questions
        .filter(q => q.difficulty === 'medium')
        .slice(0, mediumCount)
        .map(q => q.id);
      
      const hardQuestions = questions
        .filter(q => q.difficulty === 'hard')
        .slice(0, hardCount)
        .map(q => q.id);
      
      selectedQuestions.push(...easyQuestions, ...mediumQuestions, ...hardQuestions);
      
      // If not enough questions of specific difficulty, fill with any available
      const needed = weight - (easyQuestions.length + mediumQuestions.length + hardQuestions.length);
      if (needed > 0) {
        const usedIds = new Set([...easyQuestions, ...mediumQuestions, ...hardQuestions]);
        const additionalQuestions = questions
          .filter(q => !usedIds.has(q.id))
          .slice(0, needed)
          .map(q => q.id);
        
        selectedQuestions.push(...additionalQuestions);
      }
    }
    
    // Shuffle if required
    if (finalBlueprint.rules.shuffle) {
      this.shuffleArray(selectedQuestions);
    }
    
    // Create exam config
    const config: InsertExamConfig = {
      id: finalBlueprint.id,
      title: finalBlueprint.title,
      description: finalBlueprint.description,
      durationMinutes: Math.floor(finalBlueprint.duration / 60),
      passingScore: finalBlueprint.passingScore,
      questionCount: selectedQuestions.length,
      topics: Array.from(finalBlueprint.topicWeights.keys()),
      rules: finalBlueprint.rules,
      isActive: true
    };
    
    return { config, questionIds: selectedQuestions };
  }
  
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  async saveExamConfig(config: InsertExamConfig, questionIds: string[]): Promise<string> {
    // Check if exam config already exists
    const existing = await storage.getExamConfig(config.id);
    
    if (existing) {
      console.log(`Exam config already exists: ${config.title}`);
      return existing.id;
    }
    
    // Save exam config
    const savedConfig = await storage.createExamConfig(config);
    console.log(`Created exam config: ${savedConfig.title}`);
    
    // Save question associations
    await storage.associateQuestionsWithExam(savedConfig.id, questionIds);
    console.log(`Associated ${questionIds.length} questions with exam`);
    
    return savedConfig.id;
  }
  
  async createMiniExam(topicId: string, questionCount: number = 10): Promise<{
    config: InsertExamConfig;
    questionIds: string[];
  }> {
    const blueprint: Partial<ExamBlueprint> = {
      id: `mini-exam-${topicId}`,
      title: `${this.formatTopicName(topicId)} Mini Exam`,
      description: `Practice exam focusing on ${this.formatTopicName(topicId)}`,
      duration: questionCount * 60, // 1 minute per question
      passingScore: 70,
      topicWeights: new Map([[topicId, questionCount]]),
      rules: {
        shuffle: true,
        oneSubmit: false,
        proctor: false,
        showResults: true
      }
    };
    
    return this.buildExamForm(blueprint);
  }
  
  private formatTopicName(topicId: string): string {
    return topicId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  async generateStudyPlan(userId: string, weakTopics: string[]): Promise<{
    recommendedLessons: string[];
    practiceExams: string[];
    flashcardSets: string[];
  }> {
    const plan = {
      recommendedLessons: [],
      practiceExams: [],
      flashcardSets: []
    };
    
    // Get lessons for weak topics
    for (const topic of weakTopics) {
      // Find lessons related to this topic
      const lessons = await storage.searchLessonsByTopic(topic);
      plan.recommendedLessons.push(...lessons.slice(0, 3).map(l => l.id));
      
      // Recommend mini exam for this topic
      plan.practiceExams.push(`mini-exam-${topic}`);
      
      // Recommend flashcard sets
      plan.flashcardSets.push(`flashcards-${topic}`);
    }
    
    return plan;
  }
}