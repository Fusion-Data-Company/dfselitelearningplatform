import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, asc, desc, sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  jsonb
} from 'drizzle-orm/pg-core';

// ============ SCHEMA DEFINITIONS ============
const tracks = pgTable('tracks', {
  id: varchar('id').primaryKey(),
  title: text('title').notNull(),
  slug: varchar('slug').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

const modules = pgTable('modules', {
  id: varchar('id').primaryKey(),
  trackId: varchar('track_id'),
  title: text('title').notNull(),
  slug: varchar('slug').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

const lessons = pgTable('lessons', {
  id: varchar('id').primaryKey(),
  moduleId: varchar('module_id'),
  title: text('title').notNull(),
  slug: varchar('slug').notNull(),
  description: text('description'),
  content: text('content'),
  orderIndex: integer('order_index').notNull(),
  duration: integer('duration'),
  ceHours: real('ce_hours').default(0),
  isActive: boolean('is_active').default(true),
  published: boolean('published').default(false),
  visibility: varchar('visibility').default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
});

const questionBanks = pgTable('question_banks', {
  id: varchar('id').primaryKey(),
  title: text('title').notNull(),
  slug: varchar('slug').notNull(),
  description: text('description'),
  category: varchar('category'),
  questionCount: integer('question_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

const questions = pgTable('questions', {
  id: varchar('id').primaryKey(),
  bankId: varchar('bank_id'),
  stem: text('stem').notNull(),
  options: text('options').array(),
  answerKey: varchar('answer_key'),
  explanation: text('explanation'),
  difficulty: integer('difficulty').default(2),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

const flashcards = pgTable('flashcards', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id'),
  type: varchar('type').default('basic'),
  front: text('front'),
  back: text('back'),
  prompt: text('prompt'),
  options: text('options').array(),
  answerIndex: integer('answer_index'),
  rationale: text('rationale'),
  difficulty: real('difficulty').default(2.5),
  interval: integer('interval').default(1),
  reviewCount: integer('review_count').default(0),
  nextReview: timestamp('next_review'),
  createdAt: timestamp('created_at').defaultNow(),
});

const agentProfiles = pgTable('agent_profiles', {
  id: varchar('id').primaryKey(),
  displayName: text('display_name').notNull(),
  model: varchar('model').default('gpt-4o-mini'),
  temperature: real('temperature').default(0.7),
  maxTokens: integer('max_tokens').default(1024),
  systemPrompt: text('system_prompt'),
  guardrails: jsonb('guardrails'),
  createdAt: timestamp('created_at').defaultNow(),
});

const ceRecords = pgTable('ce_records', {
  id: varchar('id').primaryKey(),
  lessonId: varchar('lesson_id'),
  userId: varchar('user_id'),
  completedAt: timestamp('completed_at'),
  ceHours: real('ce_hours').default(0),
  certificateUrl: text('certificate_url'),
});

// ============ DATABASE CONNECTION ============
const getDb = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql);
};

// ============ ROUTE HANDLERS ============
async function handleHealth(res: VercelResponse) {
  try {
    const db = getDb();
    const result = await db.select({ count: sql`count(*)` }).from(tracks);
    return res.status(200).json({ ok: true, tracks: result[0]?.count || 0 });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

async function handleAuthUser(res: VercelResponse) {
  return res.status(200).json({ 
    id: 'guest', 
    email: 'guest@dfs215.com', 
    role: process.env.DEFAULT_ROLE || 'student' 
  });
}

async function handleLessons(res: VercelResponse) {
  try {
    const db = getDb();
    const allLessons = await db.select().from(lessons).where(eq(lessons.published, true)).limit(100);
    return res.status(200).json(allLessons);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleLessonsRecent(res: VercelResponse) {
  try {
    const db = getDb();
    const recent = await db.select().from(lessons).where(eq(lessons.published, true)).limit(20);
    return res.status(200).json(recent.map(l => ({
      ...l,
      duration: l.duration || 25,
      ceHours: l.ceHours || 0,
    })));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleLessonsEnhanced(res: VercelResponse) {
  try {
    const db = getDb();
    const allLessons = await db.select().from(lessons).where(eq(lessons.published, true)).limit(100);
    return res.status(200).json(allLessons.map(l => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      track: 'DFS-215 Course',
      module: 'Professional Content',
      trackId: 'default',
      estMinutes: l.duration || 25,
      ceHours: l.ceHours || 0,
      published: l.published,
    })));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleQuestionBanks(res: VercelResponse) {
  try {
    const db = getDb();
    const banks = await db.select().from(questionBanks);
    
    // Get questions for each bank
    const banksWithQuestions = await Promise.all(banks.map(async bank => {
      const bankQuestions = await db.select().from(questions).where(eq(questions.bankId, bank.id));
      return {
        ...bank,
        questions: bankQuestions.map(q => ({
          id: q.id,
          stem: q.stem,
          options: q.options || [],
          answerKey: q.answerKey,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
      };
    }));
    
    return res.status(200).json(banksWithQuestions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleFlashcards(res: VercelResponse) {
  try {
    const db = getDb();
    const cards = await db.select().from(flashcards).limit(500);
    return res.status(200).json(cards.map(c => ({
      id: c.id,
      type: c.type || 'mcq',
      front: c.front,
      back: c.back,
      prompt: c.prompt,
      options: c.options || [],
      answerIndex: c.answerIndex,
      rationale: c.rationale,
      difficulty: c.difficulty || 2.5,
      interval: c.interval || 1,
      reviewCount: c.reviewCount || 0,
      nextReview: c.nextReview?.toISOString() || new Date().toISOString(),
    })));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleAgents(res: VercelResponse) {
  try {
    const db = getDb();
    const agents = await db.select().from(agentProfiles);
    return res.status(200).json(agents);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleCERecords(res: VercelResponse) {
  try {
    const db = getDb();
    const records = await db.select().from(ceRecords);
    return res.status(200).json(records);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleTracks(res: VercelResponse) {
  try {
    const db = getDb();
    const allTracks = await db.select().from(tracks).orderBy(asc(tracks.orderIndex));
    return res.status(200).json(allTracks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleCourses(res: VercelResponse) {
  try {
    const db = getDb();
    const allTracks = await db.select().from(tracks);
    const allModules = await db.select().from(modules);
    const allLessons = await db.select().from(lessons).where(eq(lessons.published, true));
    
    return res.status(200).json({
      tracks: allTracks,
      modules: allModules,
      lessons: allLessons,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleCoursesProgress(res: VercelResponse) {
  try {
    const db = getDb();
    const allLessons = await db.select().from(lessons).where(eq(lessons.published, true));
    
    return res.status(200).json({
      totalLessons: allLessons.length,
      completedLessons: 0,
      progressPercent: 0,
      currentLesson: allLessons[0] || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleDashboardStats(res: VercelResponse) {
  try {
    const db = getDb();
    const [lessonCount] = await db.select({ count: sql`count(*)` }).from(lessons);
    const [flashcardCount] = await db.select({ count: sql`count(*)` }).from(flashcards);
    
    return res.status(200).json({
      totalLessons: Number(lessonCount?.count || 0),
      completedLessons: 0,
      totalFlashcards: Number(flashcardCount?.count || 0),
      studyStreak: 0,
      hoursStudied: 0,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ============ MAIN HANDLER ============
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const path = url.split('?')[0];

  try {
    // Route matching
    if (path === '/api/health' || path === '/api') {
      return handleHealth(res);
    }
    if (path === '/api/auth/user') {
      return handleAuthUser(res);
    }
    if (path === '/api/lessons/recent') {
      return handleLessonsRecent(res);
    }
    if (path === '/api/lessons/enhanced-list') {
      return handleLessonsEnhanced(res);
    }
    if (path === '/api/lessons') {
      return handleLessons(res);
    }
    if (path === '/api/question-banks') {
      return handleQuestionBanks(res);
    }
    if (path === '/api/iflash/cards' || path === '/api/flashcards') {
      return handleFlashcards(res);
    }
    if (path === '/api/iflash/stats') {
      return res.status(200).json({ totalReviewed: 0, accuracy: 0, streak: 0 });
    }
    if (path === '/api/agents') {
      return handleAgents(res);
    }
    if (path === '/api/ce/records') {
      return handleCERecords(res);
    }
    if (path === '/api/tracks') {
      return handleTracks(res);
    }
    if (path === '/api/courses') {
      return handleCourses(res);
    }
    if (path === '/api/courses/progress') {
      return handleCoursesProgress(res);
    }
    if (path === '/api/dashboard/stats') {
      return handleDashboardStats(res);
    }

    // 404 for unmatched routes
    return res.status(404).json({ error: 'Not found', path });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

