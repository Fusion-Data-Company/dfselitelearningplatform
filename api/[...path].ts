import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

// Debug endpoint that doesn't require any other imports
const debugApp = express();
debugApp.use(express.json());
debugApp.get('/api/debug', (_req, res) => {
  res.json({ 
    status: 'ok', 
    env: {
      hasDb: !!process.env.DATABASE_URL,
      hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Lazy import services to get better error messages
let storage: any;
let contentService: any;
let iflashService: any;
let examService: any;
let agentService: any;
let voiceQAService: any;
let importService: any;
let enhancedStorage: any;
let checkpointsService: any;
let progressService: any;
let db: any;
let lessons: any;
let eq: any;

let initError: Error | null = null;

try {
  // @ts-ignore
  const storageModule = require('../server/storage');
  storage = storageModule.storage;
  
  // @ts-ignore
  const contentModule = require('../server/services/content');
  contentService = contentModule.contentService;
  
  // @ts-ignore
  const iflashModule = require('../server/services/iflash');
  iflashService = iflashModule.iflashService;
  
  // @ts-ignore
  const examModule = require('../server/services/exam');
  examService = examModule.examService;
  
  // @ts-ignore
  const agentModule = require('../server/services/agents');
  agentService = agentModule.agentService;
  
  // @ts-ignore
  const voiceModule = require('../server/services/voice-qa');
  voiceQAService = voiceModule.voiceQAService;
  
  // @ts-ignore
  const importModule = require('../server/services/import/import-service');
  importService = importModule.importService;
  
  // @ts-ignore
  const enhancedModule = require('../server/services/enhanced-storage');
  enhancedStorage = enhancedModule.enhancedStorage;
  
  // @ts-ignore
  const checkpointsModule = require('../server/services/lessons/checkpoints.service');
  checkpointsService = checkpointsModule.checkpointsService;
  
  // @ts-ignore
  const progressModule = require('../server/services/lessons/progress.service');
  progressService = progressModule.progressService;
  
  // @ts-ignore
  const dbModule = require('../server/db');
  db = dbModule.db;
  
  // @ts-ignore
  const schemaModule = require('../shared/schema');
  lessons = schemaModule.lessons;
  
  // @ts-ignore
  const drizzleModule = require('drizzle-orm');
  eq = drizzleModule.eq;
} catch (error) {
  initError = error as Error;
  console.error('Service initialization failed:', error);
}

const app = express();
app.use(express.json());

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.MCP_SERVER_SECRET || 'dev-secret-key';
const getAdminSecret = (req: express.Request) =>
  (req.headers['x-admin-secret'] as string) ||
  (req.headers['mcp-server-secret'] as string);

// Auth
app.get('/api/auth/user', (_req, res) => {
  const role = process.env.DEFAULT_ROLE || 'student';
  res.json({ id: 'guest', email: 'guest@example.com', role });
});

// Healthcheck
app.get('/api/health', async (_req, res) => {
  // Return any initialization error
  if (initError) {
    return res.status(500).json({ 
      ok: false, 
      error: 'Service initialization failed',
      message: initError.message,
      stack: initError.stack 
    });
  }
  
  try {
    // Light DB touch to confirm connectivity
    await storage.getTracks();
    res.json({ ok: true });
  } catch (error: any) {
    console.error('Healthcheck failed:', error);
    res.status(500).json({ ok: false, error: 'DB unavailable', message: error?.message });
  }
});

// Courses
app.get('/api/courses', async (_req, res) => {
  try {
    const structure = await contentService.getCourseStructure();
    res.json(structure);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/progress', async (_req, res) => {
  try {
    const progress = await contentService.getUserCourseProgress('guest');
    res.json(progress);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

// Tracks
app.get('/api/tracks', async (_req, res) => {
  try {
    const tracks = await storage.getTracks();
    res.json(tracks);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch tracks' });
  }
});

app.get('/api/tracks/:id', async (req, res) => {
  try {
    const track = await storage.getTrack(req.params.id);
    if (!track) return res.status(404).json({ message: 'Track not found' });
    const modules = await storage.getModulesByTrack(track.id);
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await storage.getLessonsByModule(module.id);
        return { ...module, lessons };
      })
    );
    res.json({ ...track, modules: modulesWithLessons });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch track' });
  }
});

// Lessons
app.get('/api/lessons', async (_req, res) => {
  try {
    const lessons = await storage.getAllLessons();
    res.json(lessons);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch lessons' });
  }
});

app.get('/api/lessons/recent', async (_req, res) => {
  try {
    const recent = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        slug: lessons.slug,
        content: lessons.content,
        description: lessons.description,
        duration: lessons.duration,
        ceHours: lessons.ceHours,
        published: lessons.published,
      })
      .from(lessons)
      .where(eq(lessons.published, true))
      .limit(20);

    const filtered = recent.filter(
      (l) => l.slug && l.slug.trim().length > 0 && l.title && l.title.trim().length > 0,
    );
    res.json(
      filtered.map((l) => ({
        ...l,
        duration: l.duration || 25,
        ceHours: l.ceHours || 0,
        description: l.description || '',
        content: l.content || '',
      })),
    );
  } catch (error) {
    console.error('Error fetching recent lessons:', error);
    res.status(500).json({ message: 'Failed to fetch recent lessons' });
  }
});

app.get('/api/lessons/slug/:slug', async (req, res) => {
  try {
    const lesson = await storage.getLessonBySlug(req.params.slug);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (!lesson.published || lesson.visibility !== 'public') {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const module = lesson.moduleId ? await storage.getModule(lesson.moduleId) : null;
    const track = module?.trackId ? await storage.getTrack(module.trackId) : null;
    if (!module || !track) {
      return res.status(500).json({ message: 'Lesson associations missing' });
    }

    const checkpoints = await checkpointsService.getCheckpointsByLesson(lesson.id);
    const contentLength = lesson.content?.length || 0;
    const baseMinutes = Math.max(5, Math.ceil(contentLength / 1000));
    const checkpointMinutes = checkpoints.length * 2;
    const estMinutes = baseMinutes + checkpointMinutes;

    const ce =
      lesson.ceHours && lesson.ceHours > 0
        ? { hours: lesson.ceHours, seatTimeMin: lesson.ceHours * 60 }
        : undefined;

    res.json({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      track: track.title,
      module: module.title,
      order: lesson.orderIndex,
      checkpoints: checkpoints.map((cp) => ({
        id: cp.id,
        type: cp.type,
        title: cp.title || undefined,
        bodyMd: cp.bodyMd || undefined,
        videoUrl: cp.videoUrl || undefined,
        quiz: cp.quiz || undefined,
        gate: cp.gate || undefined,
        orderIndex: cp.orderIndex,
      })),
      estMinutes,
      published: lesson.published,
      ce,
    });
  } catch (error) {
    console.error('Error fetching lesson by slug:', error);
    res.status(500).json({ message: 'Failed to fetch lesson' });
  }
});

app.get('/api/lessons/:slug', async (req, res) => {
  try {
    const lesson = await storage.getLessonBySlug(req.params.slug);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch lesson' });
  }
});

app.get('/api/lessons/:lessonId/checkpoints', async (req, res) => {
  try {
    const checkpoints = await checkpointsService.getCheckpointsByLesson(req.params.lessonId);
    res.json(checkpoints);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch checkpoints' });
  }
});

app.get('/api/lessons/:lessonId/progress', async (req, res) => {
  try {
    const progress = await progressService.getLessonProgressSummary('guest', req.params.lessonId);
    res.json(progress || { completed: false, currentCheckpoint: 0 });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

app.post('/api/lessons/:lessonId/progress', async (req, res) => {
  try {
    await progressService.updateLessonProgress('guest', req.params.lessonId);
    const progress = await progressService.getLessonProgressSummary('guest', req.params.lessonId);
    res.json(progress);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

app.post('/api/lessons/:lessonId/checkpoint-progress', async (req, res) => {
  try {
    const { checkpointId, completed, timeSpent, quizScore, quizPassed, reflection } = req.body;
    await progressService.updateCheckpointProgress('guest', req.params.lessonId, {
      checkpointId,
      completed,
      timeSpent,
      quizScore,
      quizPassed,
      reflection,
    });
    const progress = await progressService.getLessonProgressSummary('guest', req.params.lessonId);
    res.json(progress);
  } catch (error) {
    console.error('Error updating checkpoint progress:', error);
    res.status(500).json({ message: 'Failed to update checkpoint progress' });
  }
});

// Enhanced lessons
app.get('/api/lessons/enhanced-list', async (_req, res) => {
  try {
    const publishedLessons = await db
      .select({
        id: lessons.id,
        slug: lessons.slug,
        title: lessons.title,
        ceHours: lessons.ceHours,
        published: lessons.published,
      })
      .from(lessons)
      .where(eq(lessons.published, true))
      .limit(50);

    const enhanced = publishedLessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      track: 'DFS-215 Course Content',
      module: 'Professional Content',
      trackId: 'default',
      estMinutes: 25,
      ceHours: lesson.ceHours || 0,
      published: lesson.published,
    }));

    res.json(enhanced);
  } catch (error) {
    console.error('Error fetching enhanced lessons:', error);
    res.status(500).json([]);
  }
});

app.get('/api/lessons/enhanced/:slug', async (req, res) => {
  try {
    const lesson = await storage.getLessonBySlug(req.params.slug);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    if (!lesson.published || lesson.visibility !== 'public') {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const module = lesson.moduleId ? await storage.getModule(lesson.moduleId) : null;
    const track = module?.trackId ? await storage.getTrack(module.trackId) : null;
    if (!module || !track) {
      return res.status(500).json({ message: 'Lesson associations missing' });
    }

    const lessonOverview = await enhancedStorage.getLessonOverview(lesson.id, 'guest');
    const totalCheckpoints = lessonOverview.stages.reduce(
      (sum, stage) => sum + stage.checkpoints.length,
      0,
    );
    const contentLength = lesson.content?.length || 0;
    const baseMinutes = Math.max(5, Math.ceil(contentLength / 1000));
    const checkpointMinutes = totalCheckpoints * 3;
    const estMinutes = baseMinutes + checkpointMinutes;

    const ce =
      lesson.ceHours && lesson.ceHours > 0
        ? { hours: lesson.ceHours, seatTimeMin: lesson.ceHours * 60 }
        : undefined;

    res.json({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      track: track.title,
      module: module.title,
      order: lesson.orderIndex,
      content: lesson.content || '',
      description: lesson.description || '',
      stages: lessonOverview.stages,
      estMinutes,
      published: lesson.published,
      ce,
      overallProgress: lessonOverview.overallProgress,
      hasDFS215Structure: lessonOverview.stages.length > 0,
    });
  } catch (error) {
    console.error('Error fetching enhanced lesson:', error);
    res.status(500).json({ message: 'Failed to fetch enhanced lesson' });
  }
});

app.post('/api/lessons/:id/enhanced-progress', async (req, res) => {
  try {
    const { checkpointId, status, score, attempt } = req.body;
    const progress = await enhancedStorage.updateUserProgress('guest', checkpointId, {
      lessonId: req.params.id,
      status,
      score,
      attempt,
    });
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error updating enhanced progress:', error);
    res.status(500).json({ message: 'Failed to update enhanced progress' });
  }
});

app.post('/api/lessons/:id/grade-quiz', async (req, res) => {
  try {
    const { checkpointId, userAnswers } = req.body;
    const result = await enhancedStorage.gradeQuizCheckpoint('guest', checkpointId, userAnswers);
    res.json(result);
  } catch (error) {
    console.error('Error grading quiz:', error);
    res.status(500).json({ message: 'Failed to grade quiz' });
  }
});

// Flashcards
app.get('/api/flashcards', async (_req, res) => {
  try {
    const flashcards = await storage.getUserFlashcards('system');
    res.json(flashcards);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch flashcards' });
  }
});

app.get('/api/flashcards/review', async (_req, res) => {
  try {
    const cards = await iflashService.getFlashcardsForReview('guest');
    res.json(cards);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch review cards' });
  }
});

app.post('/api/flashcards/:id/review', async (req, res) => {
  try {
    const quality = parseInt(req.body.quality, 10);
    const result = await iflashService.reviewFlashcard(req.params.id, quality, 'guest');
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to review card' });
  }
});

// iFlash cards (UI expects this path)
app.get('/api/iflash/cards', async (_req, res) => {
  try {
    const cards = await storage.getUserFlashcards('guest');
    res.json(cards);
  } catch (error) {
    console.error('Error fetching iFlash cards:', error);
    res.status(500).json({ message: 'Failed to fetch iFlash cards' });
  }
});

app.post('/api/iflash/generate', async (req, res) => {
  try {
    const { sourceIds, style, maxCards } = req.body;
    const result = await iflashService.generateFlashcardsFromContent(
      'guest',
      sourceIds || [],
      style || 'exam',
      maxCards || 60,
    );
    res.json(result);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ message: 'Failed to generate flashcards' });
  }
});

app.get('/api/iflash/stats', async (_req, res) => {
  try {
    const stats = await iflashService.getStudyStats('guest');
    res.json(stats);
  } catch (error) {
    console.error('Error fetching iFlash stats:', error);
    res.status(500).json({ message: 'Failed to fetch iFlash stats' });
  }
});

// Question banks
app.get('/api/question-banks', async (_req, res) => {
  try {
    const banks = await storage.getQuestionBanks();
    res.json(banks);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch question banks' });
  }
});

app.get('/api/question-banks/:slug', async (req, res) => {
  try {
    const bank = await storage.getQuestionBankBySlug(req.params.slug);
    if (!bank) return res.status(404).json({ message: 'Question bank not found' });
    res.json(bank);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch question bank' });
  }
});

// Exams
app.post('/api/exams/:bankId/start', async (req, res) => {
  try {
    const session = await examService.startExam(req.params.bankId, 'guest');
    res.json(session);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to start exam' });
  }
});

app.post('/api/exams/:sessionId/answer', async (req, res) => {
  try {
    const result = await examService.submitAnswer(req.params.sessionId, req.body.questionId, req.body.answer);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to submit answer' });
  }
});

app.post('/api/exams/:sessionId/finish', async (req, res) => {
  try {
    const result = await examService.finishExam(req.params.sessionId);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to finish exam' });
  }
});

app.post('/api/exams/:sessionId/flag', async (req, res) => {
  try {
    await examService.flagQuestion(req.params.sessionId, req.body.questionId, req.body.flagged);
    res.json({ success: true });
  } catch (error) {
    console.error('Error flagging question:', error);
    res.status(500).json({ message: 'Failed to flag question' });
  }
});

app.get('/api/exams/:sessionId/status', async (req, res) => {
  try {
    const status = await examService.getExamStatus(req.params.sessionId);
    res.json(status);
  } catch (error) {
    console.error('Error getting exam status:', error);
    res.status(500).json({ message: 'Failed to get exam status' });
  }
});

// Agents
app.get('/api/agents', async (_req, res) => {
  try {
    const agents = await storage.getAgentProfiles();
    res.json(agents);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch agents' });
  }
});

app.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await storage.getAgentProfile(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    res.json(agent);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch agent' });
  }
});

app.post('/api/agents/:agentId/chat', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { message, context } = req.body;
    const viewId = context
      ? `${context.route || 'unknown'}:guest${context.lessonId ? ':' + context.lessonId : ''}`
      : `unknown:guest`;
    const response = await agentService.processAgentRequest(agentId, message, viewId, 'guest');
    res.json(response);
  } catch (error) {
    console.error('Error in agent chat:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Agent error' });
  }
});

// Voice Q&A
app.post('/api/voice-qa', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question || !context) {
      return res.status(400).json({ message: 'Question and context are required' });
    }
    const response = await voiceQAService.processQuestionAndAnswer({
      question,
      context,
      userId: 'guest',
    });
    res.json(response);
  } catch (error) {
    console.error('Voice Q&A error:', error);
    res.status(500).json({ message: 'Failed to process voice Q&A request' });
  }
});

// Admin import (guarded)
app.get('/api/admin/import/status', async (req, res) => {
  const secret = getAdminSecret(req);
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { found, missing } = await importService.findAllDFSDocuments();
    res.json({
      documentsAvailable: found.length,
      documentsMissing: missing.length,
      found: found.map((d) => ({ id: d.id, title: d.title, pages: d.pages })),
      missing: missing.map((d) => ({ id: d.id, filename: d.filename })),
      ready: missing.length === 0,
    });
  } catch (error) {
    console.error('Error checking import status:', error);
    res.status(500).json({ message: 'Failed to check import status' });
  }
});

app.post('/api/admin/import/all', async (req, res) => {
  const secret = getAdminSecret(req);
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await importService.importAllDFSDocuments();
    res.json({ success: result.errors.length === 0, ...result });
  } catch (error) {
    console.error('Error during import:', error);
    res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post('/api/admin/import/clear', async (req, res) => {
  const secret = getAdminSecret(req);
  if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await importService.clearAllContent();
    res.json({ success: true, message: 'All content cleared' });
  } catch (error) {
    console.error('Error clearing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear content',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Admin agents (optional guard: only enforced when ADMIN_SECRET is set)
app.get('/api/admin/agents', async (req, res) => {
  const secret = getAdminSecret(req);
  if (ADMIN_SECRET && secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const profiles = await storage.getAgentProfiles();
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching agent profiles:', error);
    res.status(500).json({ message: 'Failed to fetch agent profiles' });
  }
});

app.post('/api/admin/agents/:agentId', async (req, res) => {
  const secret = getAdminSecret(req);
  if (ADMIN_SECRET && secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { agentId } = req.params;
    const profileData = req.body;
    const profile = await storage.upsertAgentProfile({
      id: agentId,
      ...profileData,
    });
    res.json(profile);
  } catch (error) {
    console.error('Error updating agent profile:', error);
    res.status(500).json({ message: 'Failed to update agent profile' });
  }
});

// CE Records
app.get('/api/ce/records', async (_req, res) => {
  try {
    const records = await storage.getUserCERecords('guest');
    res.json(records);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch CE records' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (_req, res) => {
  try {
    const [lessons, flashcards, progress] = await Promise.all([
      storage.getAllLessons(),
      storage.getUserFlashcards('system'),
      storage.getUserProgress('guest')
    ]);

    const completedLessons = progress.filter((p: any) => p.completed).length;

    res.json({
      totalLessons: lessons.length,
      completedLessons,
      totalFlashcards: flashcards.length,
      studyStreak: 0,
      hoursStudied: 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Handler for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Try debug endpoint first (doesn't require services)
  if (req.url?.startsWith('/api/debug')) {
    return debugApp(req as any, res as any);
  }
  return app(req as any, res as any);
}
