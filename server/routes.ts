import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// import { setupAuth, isAuthenticated } from "./replitAuth";
import { agentService } from "./services/agents";
import { mcpServer } from "./services/mcp";
import { iflashService } from "./services/iflash";
import { examService } from "./services/exam";
import { contentService } from "./services/content";
import { z } from "zod";

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

  // Lesson routes
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
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
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

  // MCP/Agent routes
  app.post('/api/mcp/get-context', async (req: any, res) => {
    try {
      const { viewId } = req.body;
      const context = await mcpServer.getContext(viewId);
      res.json(context);
    } catch (error) {
      console.error("Error getting context:", error);
      res.status(500).json({ message: "Failed to get context" });
    }
  });

  app.post('/api/mcp/retrieve-content', async (req: any, res) => {
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
      const { message, viewId } = req.body;

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
