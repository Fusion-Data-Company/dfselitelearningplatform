import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// import { setupAuth, isAuthenticated } from "./replitAuth";
import { agentService } from "./services/agents";
import { mcpServer } from "./services/mcp";
import { iflashService } from "./services/iflash";
import { examService } from "./services/exam";
import { contentService } from "./services/content";
import { voiceQAService } from "./services/voice-qa";
import { importService, DFS_DOCUMENTS } from "./services/import/import-service";
import { z } from "zod";
import { checkpointsService } from "./services/lessons/checkpoints.service";
import { progressService } from "./services/lessons/progress.service";
import { lessonDTOSchema } from "../shared/schemas/lesson";
import { db } from "./db";
import { lessons } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - disabled
  // await setupAuth(app);

  // Initialize default content and agents on startup
  setTimeout(async () => {
    try {
      await contentService.initializeDefaultContent();
      await agentService.initializeDefaultAgents();
      console.log('System initialization completed');
    } catch (error) {
      console.error('System initialization failed:', error);
    }
  }, 1000);

  // Auth routes - disabled
  app.get('/api/auth/user', async (req: any, res) => {
    // Return mock user for now
    res.json({ id: 'guest', email: 'guest@example.com', role: 'student' });
  });

  // Course structure routes
  app.get('/api/courses', async (req: any, res) => {
    try {
      const structure = await contentService.getCourseStructure();
      res.json(structure);
    } catch (error) {
      console.error("Error fetching course structure:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/progress', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const progress = await contentService.getUserCourseProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Track routes
  app.get('/api/tracks/:id', async (req, res) => {
    try {
      const track = await storage.getTrack(req.params.id);
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }
      
      // Get modules with lessons for this track
      const modules = await storage.getModulesByTrack(track.id);
      const modulesWithLessons = await Promise.all(
        modules.map(async (module) => {
          const lessons = await storage.getLessonsByModule(module.id);
          return { ...module, lessons };
        })
      );
      
      res.json({ ...track, modules: modulesWithLessons });
    } catch (error) {
      console.error("Error fetching track:", error);
      res.status(500).json({ message: "Failed to fetch track" });
    }
  });

  // Lesson routes
  app.get('/api/lessons', async (req, res) => {
    try {
      // Get all lessons from all modules
      const tracks = await storage.getTracks();
      const allLessons: any[] = [];
      
      for (const track of tracks) {
        const modules = await storage.getModulesByTrack(track.id);
        for (const module of modules) {
          const lessons = await storage.getLessonsByModule(module.id);
          allLessons.push(...lessons);
        }
      }
      
      res.json(allLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get('/api/lessons/recent', async (req, res) => {
    try {
      // Get all tracks and their lessons with full hierarchy
      const tracks = await storage.getTracks();
      const allLessons: any[] = [];
      
      for (const track of tracks) {
        const trackModules = await storage.getModulesByTrack(track.id);
        for (const module of trackModules) {
          const moduleLessons = await storage.getLessonsByModule(module.id);
          // Filter to published lessons and add track/module info
          allLessons.push(...moduleLessons
            .filter(lesson => lesson.published && lesson.slug && lesson.title)
            .map(lesson => ({
              id: lesson.id,
              title: lesson.title,
              slug: lesson.slug,
              content: lesson.content || '',
              description: lesson.description || '',
              duration: lesson.duration || 25,
              ceHours: lesson.ceHours || 0,
              track: track.title,
              module: module.title,
              trackId: track.id
            })));
        }
      }
      
      // Return most recent lessons (limit 20)
      const recentLessons = allLessons.slice(0, 20);
      
      console.log(`Recent lessons found: ${recentLessons.length}`);
      
      res.json(recentLessons);
    } catch (error) {
      console.error("Error fetching recent lessons:", error);
      res.status(500).json({ message: "Failed to fetch recent lessons" });
    }
  });

  // Enhanced lessons list endpoint (must be before slug route)
  app.get('/api/lessons/enhanced-list', async (req, res) => {
    try {
      // Get all lessons with track/module info
      const tracks = await storage.getTracks();
      const allLessons: any[] = [];
      
      for (const track of tracks) {
        const modules = await storage.getModulesByTrack(track.id);
        for (const module of modules) {
          const moduleLessons = await storage.getLessonsByModule(module.id);
          // Add track info to each lesson, filter to published only
          allLessons.push(...moduleLessons
            .filter(lesson => lesson.published)
            .map(lesson => ({
              ...lesson,
              trackId: track.id,
              track: track.title,
              module: module.title
            })));
        }
      }
      
      // Get checkpoint counts for each lesson
      const enhancedLessons = await Promise.all(allLessons.map(async (lesson) => {
        // Try to get checkpoint count
        let checkpointCount = 0;
        let stageCount = 0;
        try {
          const checkpoints = await checkpointsService.getCheckpointsByLesson(lesson.id);
          checkpointCount = checkpoints.length;
          stageCount = checkpointCount > 0 ? Math.ceil(checkpointCount / 3) : 0;
        } catch (e) {
          // Ignore errors
        }
        
        return {
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          track: lesson.track,
          module: lesson.module,
          trackId: lesson.trackId,
          estMinutes: lesson.duration || 25,
          ceHours: lesson.ceHours || 0,
          hasDFS215Structure: checkpointCount > 0,
          stageCount,
          checkpointCount
        };
      }));
      
      res.json(enhancedLessons);
    } catch (error) {
      console.error("Error fetching enhanced lessons list:", error);
      res.status(500).json([]);
    }
  });

  app.get('/api/lessons/:id', async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.get('/api/lessons/slug/:slug', async (req, res) => {
    try {
      const lesson = await storage.getLessonBySlug(req.params.slug);
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      // Check if lesson is published
      if (!lesson.published || lesson.visibility !== 'public') {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      // Get module and track information
      const module = await storage.getModule(lesson.moduleId!);
      if (!module) {
        return res.status(500).json({ message: 'Module not found for lesson' });
      }

      const track = await storage.getTrack(module.trackId!);
      if (!track) {
        return res.status(500).json({ message: 'Track not found for lesson' });
      }

      // Get checkpoints for this lesson
      const checkpoints = await checkpointsService.getCheckpointsByLesson(lesson.id);

      // Calculate estimated minutes based on content length and checkpoints
      const contentLength = lesson.content?.length || 0;
      const baseMinutes = Math.max(5, Math.ceil(contentLength / 1000)); // ~1 minute per 1000 chars
      const checkpointMinutes = checkpoints.length * 2; // ~2 minutes per checkpoint
      const estMinutes = baseMinutes + checkpointMinutes;

      // Build CE metadata if applicable
      const ce = lesson.ceHours && lesson.ceHours > 0 ? {
        hours: lesson.ceHours,
        seatTimeMin: lesson.ceHours * 60 // Convert hours to minutes
      } : undefined;

      // Build LessonDTO response
      const lessonDTO = {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        track: track.title,
        module: module.title,
        order: lesson.orderIndex,
        checkpoints: checkpoints.map(cp => ({
          id: cp.id,
          type: cp.type,
          title: cp.title || undefined,
          bodyMd: cp.bodyMd || undefined,
          videoUrl: cp.videoUrl || undefined,
          quiz: cp.quiz || undefined,
          gate: cp.gate || undefined,
          orderIndex: cp.orderIndex
        })),
        estMinutes,
        published: lesson.published,
        ce
      };

      // Validate the response structure
      const validatedDTO = lessonDTOSchema.parse(lessonDTO);

      res.json(validatedDTO);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });


  // Enhanced DFS-215 lesson endpoint with structured stages and checkpoints
  app.get('/api/lessons/enhanced/:slug', async (req, res) => {
    try {
      const lesson = await storage.getLessonBySlug(req.params.slug);
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      // Check if lesson is published
      if (!lesson.published || lesson.visibility !== 'public') {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      // Import enhanced storage service
      const { enhancedStorage } = await import('./services/enhanced-storage');
      
      // Get lesson overview with DFS-215 structure
      const userId = 'guest'; // Use guest user for now
      const lessonOverview = await enhancedStorage.getLessonOverview(lesson.id, userId);

      // Get module and track information
      const module = await storage.getModule(lesson.moduleId!);
      if (!module) {
        return res.status(500).json({ message: 'Module not found for lesson' });
      }

      const track = await storage.getTrack(module.trackId!);
      if (!track) {
        return res.status(500).json({ message: 'Track not found for lesson' });
      }

      // Calculate estimated minutes based on stages and checkpoints
      const totalCheckpoints = lessonOverview.stages.reduce((sum, stage) => sum + stage.checkpoints.length, 0);
      const contentLength = lesson.content?.length || 0;
      const baseMinutes = Math.max(5, Math.ceil(contentLength / 1000));
      const checkpointMinutes = totalCheckpoints * 3; // ~3 minutes per DFS-215 checkpoint
      const estMinutes = baseMinutes + checkpointMinutes;

      // Build CE metadata
      const ce = lesson.ceHours && lesson.ceHours > 0 ? {
        hours: lesson.ceHours,
        seatTimeMin: lesson.ceHours * 60
      } : undefined;

      // Build enhanced lesson response
      const enhancedLessonDTO = {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        track: track.title,
        module: module.title,
        order: lesson.orderIndex,
        content: lesson.content || '',
        description: lesson.description || '',
        stages: lessonOverview.stages.map(stage => ({
          id: stage.id,
          title: stage.title,
          order: stage.order,
          gateRule: stage.gateRule,
          canAccess: stage.canAccess,
          checkpoints: stage.checkpoints.map(cp => ({
            id: cp.id,
            order: cp.order,
            kind: cp.kind,
            label: cp.label,
            prompt: cp.prompt,
            choices: cp.choices,
            answerKey: cp.answerKey,
            explain: cp.explain,
            tags: cp.tags || []
          })),
          userProgress: stage.userProgress || []
        })),
        estMinutes,
        published: lesson.published,
        ce,
        overallProgress: lessonOverview.overallProgress,
        hasDFS215Structure: lessonOverview.stages.length > 0
      };

      res.json(enhancedLessonDTO);
    } catch (error) {
      console.error("Error fetching enhanced lesson:", error);
      res.status(500).json({ message: "Failed to fetch enhanced lesson" });
    }
  });

  // Enhanced checkpoint progress endpoint
  app.post('/api/lessons/:id/enhanced-progress', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { checkpointId, status, score, attempt } = req.body;
      
      const { enhancedStorage } = await import('./services/enhanced-storage');
      
      const progress = await enhancedStorage.updateUserProgress(userId, checkpointId, {
        lessonId: req.params.id,
        status,
        score,
        attempt
      });
      
      res.json({ success: true, progress });
    } catch (error) {
      console.error("Error updating enhanced progress:", error);
      res.status(500).json({ message: "Failed to update enhanced progress" });
    }
  });

  // Grade quiz checkpoint endpoint
  app.post('/api/lessons/:id/grade-quiz', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { checkpointId, userAnswers } = req.body;
      
      const { enhancedStorage } = await import('./services/enhanced-storage');
      
      const result = await enhancedStorage.gradeQuizCheckpoint(userId, checkpointId, userAnswers);
      
      res.json(result);
    } catch (error) {
      console.error("Error grading quiz:", error);
      res.status(500).json({ message: "Failed to grade quiz" });
    }
  });

  app.post('/api/lessons/:id/progress', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { completed, timeSpent, progressPercent } = req.body;
      
      const progress = await storage.updateUserProgress(userId, req.params.id, {
        completed,
        timeSpent,
        progressPercent
      });
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.post('/api/lessons/:id/checkpoint-progress', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { 
        checkpointId, 
        completed, 
        timeSpent, 
        quizScore, 
        quizPassed, 
        reflection 
      } = req.body;
      
      await progressService.updateCheckpointProgress(userId, req.params.id, {
        checkpointId,
        completed,
        timeSpent,
        quizScore,
        quizPassed,
        reflection
      });
      
      res.json({ success: true, message: "Checkpoint progress updated successfully" });
    } catch (error) {
      console.error("Error updating checkpoint progress:", error);
      res.status(500).json({ message: "Failed to update checkpoint progress" });
    }
  });

  // MCP/Agent routes with authentication
  const mcpAuth = (req: any, res: any, next: any) => {
    const mcpSecret = req.headers['mcp-server-secret'];
    const expectedSecret = process.env.MCP_SERVER_SECRET || 'dev-secret-key';
    
    if (!mcpSecret || mcpSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: MCP_SERVER_SECRET required' });
    }
    next();
  };

  app.post('/api/mcp/get-context', mcpAuth, async (req: any, res) => {
    try {
      const { viewId } = req.body;
      const context = await mcpServer.getContext(viewId);
      res.json(context);
    } catch (error) {
      console.error("Error getting context:", error);
      res.status(500).json({ message: "Failed to get context" });
    }
  });

  app.post('/api/mcp/retrieve-content', mcpAuth, async (req: any, res) => {
    try {
      const { query, ids, k } = req.body;
      const result = await mcpServer.retrieveContent({ query, ids, k });
      res.json(result);
    } catch (error) {
      console.error("Error retrieving content:", error);
      res.status(500).json({ message: "Failed to retrieve content" });
    }
  });

  app.post('/api/agents/:agentId/chat', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { agentId } = req.params;
      const { message, context } = req.body;
      
      // Build viewId from context if provided, or default
      const viewId = context ? `${context.route || 'unknown'}:${userId}${context.lessonId ? ':' + context.lessonId : ''}` : `unknown:${userId}`;
      
      console.log('Agent request:', { agentId, message: message?.substring(0, 50), context, viewId });

      const response = await agentService.processAgentRequest(
        agentId,
        message,
        viewId,
        userId
      );

      res.json(response);
    } catch (error) {
      console.error(`Error in agent ${req.params.agentId}:`, error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Agent error" });
    }
  });

  // Voice Q&A routes
  app.post('/api/voice-qa', async (req: any, res) => {
    try {
      const { question, context } = req.body;
      const userId = 'guest'; // Use guest user for now
      
      if (!question || !context) {
        return res.status(400).json({ message: 'Question and context are required' });
      }

      const response = await voiceQAService.processQuestionAndAnswer({
        question,
        context,
        userId
      });

      res.json(response);
    } catch (error) {
      console.error("Voice Q&A error:", error);
      res.status(500).json({ message: "Failed to process voice Q&A request" });
    }
  });

  // iFlash routes
  app.get('/api/iflash/cards', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const cards = await iflashService.getFlashcardsForReview(userId, 50);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.get('/api/iflash/stats', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const stats = await iflashService.getStudyStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching iFlash stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post('/api/iflash/generate', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { sourceIds, style, maxCards } = req.body;

      const result = await iflashService.generateFlashcardsFromContent(
        userId,
        sourceIds,
        style,
        maxCards
      );

      res.json(result);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ message: "Failed to generate flashcards" });
    }
  });

  app.post('/api/iflash/review/:cardId', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { cardId } = req.params;
      const { grade } = req.body;

      const updatedCard = await iflashService.reviewFlashcard(userId, cardId, grade);
      res.json(updatedCard);
    } catch (error) {
      console.error("Error reviewing flashcard:", error);
      res.status(500).json({ message: "Failed to review flashcard" });
    }
  });

  // Quiz/Exam routes
  app.get('/api/question-banks', async (req, res) => {
    try {
      const banks = await storage.getQuestionBanks();
      res.json(banks);
    } catch (error) {
      console.error("Error fetching question banks:", error);
      res.status(500).json({ message: "Failed to fetch question banks" });
    }
  });

  app.post('/api/exams/:bankId/start', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { bankId } = req.params;

      const session = await examService.startExam(userId, bankId);
      res.json(session);
    } catch (error) {
      console.error("Error starting exam:", error);
      res.status(500).json({ message: "Failed to start exam" });
    }
  });

  app.post('/api/exams/:sessionId/answer', async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, answer } = req.body;

      const result = await examService.submitAnswer(sessionId, questionId, answer);
      res.json(result);
    } catch (error) {
      console.error("Error submitting answer:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.post('/api/exams/:sessionId/flag', async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, flagged } = req.body;

      await examService.flagQuestion(sessionId, questionId, flagged);
      res.json({ success: true });
    } catch (error) {
      console.error("Error flagging question:", error);
      res.status(500).json({ message: "Failed to flag question" });
    }
  });

  app.post('/api/exams/:sessionId/finish', async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const results = await examService.finishExam(sessionId);
      res.json(results);
    } catch (error) {
      console.error("Error finishing exam:", error);
      res.status(500).json({ message: "Failed to finish exam" });
    }
  });

  app.get('/api/exams/:sessionId/status', async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const status = await examService.getExamStatus(sessionId);
      res.json(status);
    } catch (error) {
      console.error("Error getting exam status:", error);
      res.status(500).json({ message: "Failed to get exam status" });
    }
  });

  // Quiz attempts history
  app.get('/api/quiz-attempts', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const attempts = await storage.getUserQuizAttempts(userId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // Admin routes (basic)

  // DFS-215 Content Import - Import all 5 compliance documents
  app.get('/api/admin/import/status', async (_req: any, res: any) => {
    try {
      const { found, missing } = await importService.findAllDFSDocuments();
      res.json({
        documentsAvailable: DFS_DOCUMENTS.length,
        documentsFound: found.length,
        documentsMissing: missing.length,
        found: found.map(d => ({ id: d.id, title: d.title, pages: d.pages })),
        missing: missing.map(d => ({ id: d.id, filename: d.filename })),
        ready: found.length === DFS_DOCUMENTS.length
      });
    } catch (error) {
      console.error("Error checking import status:", error);
      res.status(500).json({ message: "Failed to check import status" });
    }
  });

  app.post('/api/admin/import/all', async (_req: any, res: any) => {
    try {
      console.log('Starting full DFS-215 content import...');
      const result = await importService.importAllDFSDocuments();
      res.json({
        success: result.errors.length === 0,
        ...result
      });
    } catch (error) {
      console.error("Error during import:", error);
      res.status(500).json({
        success: false,
        message: "Import failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/admin/import/clear', async (_req: any, res: any) => {
    try {
      console.log('Clearing all content...');
      await importService.clearAllContent();
      res.json({ success: true, message: "All content cleared" });
    } catch (error) {
      console.error("Error clearing content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear content",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/admin/agents', async (req: any, res) => {
    try {
      // Allow all access for now (no auth)
      const profiles = await storage.getAgentProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching agent profiles:", error);
      res.status(500).json({ message: "Failed to fetch agent profiles" });
    }
  });

  app.post('/api/admin/agents/:agentId', async (req: any, res) => {
    try {
      // Allow all access for now (no auth)
      const { agentId } = req.params;
      const profileData = req.body;

      const profile = await storage.upsertAgentProfile({
        id: agentId,
        ...profileData
      });

      res.json(profile);
    } catch (error) {
      console.error("Error updating agent profile:", error);
      res.status(500).json({ message: "Failed to update agent profile" });
    }
  });

  // CE records
  app.get('/api/ce/records', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const records = await storage.getUserCERecords(userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching CE records:", error);
      res.status(500).json({ message: "Failed to fetch CE records" });
    }
  });

  app.post('/api/ce/complete', async (req: any, res) => {
    try {
      const userId = 'guest'; // Use guest user for now
      const { lessonId, hours } = req.body;

      const record = await storage.createCERecord({
        userId,
        lessonId,
        hours,
        completedAt: new Date(),
        certificateUrl: null
      });

      res.json(record);
    } catch (error) {
      console.error("Error creating CE record:", error);
      res.status(500).json({ message: "Failed to create CE record" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
