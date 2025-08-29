import {
  users,
  tracks,
  modules,
  lessons,
  contentChunks,
  questionBanks,
  questions,
  userProgress,
  quizAttempts,
  flashcards,
  flashcardReviews,
  agentProfiles,
  agentLogs,
  ceRecords,
  type User,
  type UpsertUser,
  type Track,
  type Module,
  type Lesson,
  type ContentChunk,
  type QuestionBank,
  type Question,
  type UserProgress,
  type QuizAttempt,
  type Flashcard,
  type FlashcardReview,
  type AgentProfile,
  type AgentLog,
  type CERecord,
  type InsertTrack,
  type InsertModule,
  type InsertLesson,
  type InsertQuestionBank,
  type InsertQuestion,
  type InsertQuizAttempt,
  type InsertFlashcard,
  type InsertAgentProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Course structure
  getTracks(): Promise<Track[]>;
  getTrack(id: string): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: string, track: Partial<InsertTrack>): Promise<Track>;
  deleteTrack(id: string): Promise<void>;

  getModulesByTrack(trackId: string): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, module: Partial<InsertModule>): Promise<Module>;
  deleteModule(id: string): Promise<void>;

  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonBySlug(slug: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;

  // Content chunks
  getContentChunksByLesson(lessonId: string): Promise<ContentChunk[]>;
  getContentChunk(id: string): Promise<ContentChunk | undefined>;
  searchContentChunks(query: string, limit?: number): Promise<ContentChunk[]>;

  // Question banks and questions
  getQuestionBanks(): Promise<QuestionBank[]>;
  getQuestionBank(id: string): Promise<QuestionBank | undefined>;
  createQuestionBank(bank: InsertQuestionBank): Promise<QuestionBank>;
  updateQuestionBank(id: string, bank: Partial<InsertQuestionBank>): Promise<QuestionBank>;

  getQuestionsByBank(bankId: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question>;

  // User progress
  getUserProgress(userId: string, lessonId?: string): Promise<UserProgress[]>;
  updateUserProgress(userId: string, lessonId: string, progress: Partial<UserProgress>): Promise<UserProgress>;

  // Quiz attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  updateQuizAttempt(id: string, attempt: Partial<QuizAttempt>): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;

  // Flashcards
  getUserFlashcards(userId: string): Promise<Flashcard[]>;
  getFlashcardsForReview(userId: string): Promise<Flashcard[]>;
  createFlashcard(card: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, card: Partial<Flashcard>): Promise<Flashcard>;
  deleteFlashcard(id: string): Promise<void>;

  createFlashcardReview(review: Omit<FlashcardReview, 'id'>): Promise<FlashcardReview>;

  // Agent profiles
  getAgentProfiles(): Promise<AgentProfile[]>;
  getAgentProfile(id: string): Promise<AgentProfile | undefined>;
  upsertAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile>;

  createAgentLog(log: Omit<AgentLog, 'id' | 'createdAt'>): Promise<AgentLog>;
  getAgentLogs(userId?: string, agent?: string): Promise<AgentLog[]>;

  // CE records
  getUserCERecords(userId: string): Promise<CERecord[]>;
  createCERecord(record: Omit<CERecord, 'id'>): Promise<CERecord>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course structure
  async getTracks(): Promise<Track[]> {
    return await db.select().from(tracks).orderBy(asc(tracks.orderIndex));
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track;
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db.insert(tracks).values(track).returning();
    return newTrack;
  }

  async updateTrack(id: string, track: Partial<InsertTrack>): Promise<Track> {
    const [updatedTrack] = await db
      .update(tracks)
      .set(track)
      .where(eq(tracks.id, id))
      .returning();
    return updatedTrack;
  }

  async deleteTrack(id: string): Promise<void> {
    await db.delete(tracks).where(eq(tracks.id, id));
  }

  async getModulesByTrack(trackId: string): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.trackId, trackId))
      .orderBy(asc(modules.orderIndex));
  }

  async getModule(id: string): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: string, module: Partial<InsertModule>): Promise<Module> {
    const [updatedModule] = await db
      .update(modules)
      .set(module)
      .where(eq(modules.id, id))
      .returning();
    return updatedModule;
  }

  async deleteModule(id: string): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(asc(lessons.orderIndex));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getLessonBySlug(slug: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.slug, slug));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson> {
    const [updatedLesson] = await db
      .update(lessons)
      .set(lesson)
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Content chunks
  async getContentChunksByLesson(lessonId: string): Promise<ContentChunk[]> {
    return await db
      .select()
      .from(contentChunks)
      .where(eq(contentChunks.lessonId, lessonId))
      .orderBy(asc(contentChunks.orderIndex));
  }

  async getContentChunk(id: string): Promise<ContentChunk | undefined> {
    const [chunk] = await db.select().from(contentChunks).where(eq(contentChunks.id, id));
    return chunk;
  }

  async searchContentChunks(query: string, limit = 5): Promise<ContentChunk[]> {
    // Simple text search - in production would use vector similarity
    return await db
      .select()
      .from(contentChunks)
      .where(sql`${contentChunks.text} ILIKE ${'%' + query + '%'}`)
      .limit(limit);
  }

  // Question banks and questions
  async getQuestionBanks(): Promise<QuestionBank[]> {
    return await db.select().from(questionBanks);
  }

  async getQuestionBank(id: string): Promise<QuestionBank | undefined> {
    const [bank] = await db.select().from(questionBanks).where(eq(questionBanks.id, id));
    return bank;
  }

  async createQuestionBank(bank: InsertQuestionBank): Promise<QuestionBank> {
    const [newBank] = await db.insert(questionBanks).values(bank).returning();
    return newBank;
  }

  async updateQuestionBank(id: string, bank: Partial<InsertQuestionBank>): Promise<QuestionBank> {
    const [updatedBank] = await db
      .update(questionBanks)
      .set(bank)
      .where(eq(questionBanks.id, id))
      .returning();
    return updatedBank;
  }

  async getQuestionsByBank(bankId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.bankId, bankId));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  // User progress
  async getUserProgress(userId: string, lessonId?: string): Promise<UserProgress[]> {
    if (lessonId) {
      return await db.select().from(userProgress).where(
        and(eq(userProgress.userId, userId), eq(userProgress.lessonId, lessonId))
      );
    }
    
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(userId: string, lessonId: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    const [updatedProgress] = await db
      .insert(userProgress)
      .values({
        userId,
        lessonId,
        ...progress,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.lessonId],
        set: {
          ...progress,
          lastAccessed: new Date(),
        },
      })
      .returning();
    return updatedProgress;
  }

  // Quiz attempts
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt;
  }

  async updateQuizAttempt(id: string, attempt: Partial<QuizAttempt>): Promise<QuizAttempt> {
    const [updatedAttempt] = await db
      .update(quizAttempts)
      .set(attempt)
      .where(eq(quizAttempts.id, id))
      .returning();
    return updatedAttempt;
  }

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.startedAt));
  }

  // Flashcards
  async getUserFlashcards(userId: string): Promise<Flashcard[]> {
    return await db.select().from(flashcards).where(eq(flashcards.userId, userId));
  }

  async getFlashcardsForReview(userId: string): Promise<Flashcard[]> {
    return await db
      .select()
      .from(flashcards)
      .where(
        and(
          eq(flashcards.userId, userId),
          lte(flashcards.nextReview, new Date())
        )
      )
      .orderBy(asc(flashcards.nextReview));
  }

  async createFlashcard(card: InsertFlashcard): Promise<Flashcard> {
    const [newCard] = await db.insert(flashcards).values(card).returning();
    return newCard;
  }

  async updateFlashcard(id: string, card: Partial<Flashcard>): Promise<Flashcard> {
    const [updatedCard] = await db
      .update(flashcards)
      .set(card)
      .where(eq(flashcards.id, id))
      .returning();
    return updatedCard;
  }

  async deleteFlashcard(id: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  async createFlashcardReview(review: Omit<FlashcardReview, 'id'>): Promise<FlashcardReview> {
    const [newReview] = await db.insert(flashcardReviews).values(review).returning();
    return newReview;
  }

  // Agent profiles
  async getAgentProfiles(): Promise<AgentProfile[]> {
    return await db.select().from(agentProfiles);
  }

  async getAgentProfile(id: string): Promise<AgentProfile | undefined> {
    const [profile] = await db.select().from(agentProfiles).where(eq(agentProfiles.id, id));
    return profile;
  }

  async upsertAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile> {
    const [newProfile] = await db
      .insert(agentProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: agentProfiles.id,
        set: {
          ...profile,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newProfile;
  }

  async createAgentLog(log: Omit<AgentLog, 'id' | 'createdAt'>): Promise<AgentLog> {
    const [newLog] = await db.insert(agentLogs).values(log).returning();
    return newLog;
  }

  async getAgentLogs(userId?: string, agent?: string): Promise<AgentLog[]> {
    let conditions = undefined;
    
    if (userId && agent) {
      conditions = and(eq(agentLogs.userId, userId), eq(agentLogs.agent, agent));
    } else if (userId) {
      conditions = eq(agentLogs.userId, userId);
    } else if (agent) {
      conditions = eq(agentLogs.agent, agent);
    }
    
    if (conditions) {
      return await db.select().from(agentLogs).where(conditions).orderBy(desc(agentLogs.createdAt));
    } else {
      return await db.select().from(agentLogs).orderBy(desc(agentLogs.createdAt));
    }
  }

  // CE records
  async getUserCERecords(userId: string): Promise<CERecord[]> {
    return await db
      .select()
      .from(ceRecords)
      .where(eq(ceRecords.userId, userId))
      .orderBy(desc(ceRecords.completedAt));
  }

  async createCERecord(record: Omit<CERecord, 'id'>): Promise<CERecord> {
    const [newRecord] = await db.insert(ceRecords).values(record).returning();
    return newRecord;
  }
}

export const storage = new DatabaseStorage();
