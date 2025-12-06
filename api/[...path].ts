import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { storage } from '../server/storage';
import { contentService } from '../server/services/content';
import { iflashService } from '../server/services/iflash';
import { examService } from '../server/services/exam';
import { checkpointsService } from '../server/services/lessons/checkpoints.service';
import { progressService } from '../server/services/lessons/progress.service';
import type { UserProgress } from '../shared/schema';

const app = express();
app.use(express.json());

// Auth
app.get('/api/auth/user', (_req, res) => {
  res.json({ id: 'guest', email: 'guest@example.com', role: 'student' });
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

    const completedLessons = progress.filter((p: UserProgress) => p.completed).length;

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
  return app(req as any, res as any);
}
