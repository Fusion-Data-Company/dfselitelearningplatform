import { z } from "zod";

// Quiz item schema for microquizzes
export const quizItemSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "tf"]),
  stem: z.string(),
  options: z.array(z.string()),
  answerIndex: z.number().min(0),
  rationale: z.string().optional(),
  chunkRef: z.object({
    chunkId: z.string(),
    headingPath: z.string().optional(),
  }).optional(),
});

export type QuizItem = z.infer<typeof quizItemSchema>;

// Checkpoint gate configuration
export const checkpointGateSchema = z.object({
  requires: z.array(z.string()), // Array of required checkpoint IDs
});

export type CheckpointGate = z.infer<typeof checkpointGateSchema>;

// Quiz configuration for microquiz checkpoints
export const checkpointQuizSchema = z.object({
  items: z.array(quizItemSchema),
});

export type CheckpointQuiz = z.infer<typeof checkpointQuizSchema>;

// Individual checkpoint schema
export const checkpointSchema = z.object({
  id: z.string(),
  type: z.enum([
    "intro",
    "objectives", 
    "reading",
    "video",
    "iflash",
    "microquiz",
    "reflection",
    "completion"
  ]),
  title: z.string().optional(),
  bodyMd: z.string().optional(),
  videoUrl: z.string().url().optional(),
  quiz: checkpointQuizSchema.optional(),
  gate: checkpointGateSchema.optional(),
  orderIndex: z.number(),
});

export type Checkpoint = z.infer<typeof checkpointSchema>;

// CE (Continuing Education) metadata
export const ceLessonMetaSchema = z.object({
  hours: z.number().positive(),
  seatTimeMin: z.number().positive().optional(),
});

export type CELessonMeta = z.infer<typeof ceLessonMetaSchema>;

// Complete lesson DTO for API responses
export const lessonDTOSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  track: z.string(),
  module: z.string(),
  order: z.number(),
  checkpoints: z.array(checkpointSchema),
  estMinutes: z.number().positive(),
  published: z.boolean(),
  ce: ceLessonMetaSchema.optional(),
});

export type LessonDTO = z.infer<typeof lessonDTOSchema>;

// Lesson progress for API requests
export const lessonProgressRequestSchema = z.object({
  lessonId: z.string(),
  checkpointId: z.string(),
  timeSpent: z.number().min(0),
  seatTimeMs: z.number().min(0).optional(),
  attemptData: z.record(z.any()).optional(),
});

export type LessonProgressRequest = z.infer<typeof lessonProgressRequestSchema>;

// Quiz submission schema
export const quizSubmissionSchema = z.object({
  attemptId: z.string(),
  responses: z.array(z.object({
    questionId: z.string(),
    selectedIndex: z.number().min(0),
  })),
});

export type QuizSubmission = z.infer<typeof quizSubmissionSchema>;

// Quiz grading response
export const quizGradingResponseSchema = z.object({
  score: z.number().min(0).max(100),
  totalQuestions: z.number().positive(),
  correctAnswers: z.number().min(0),
  passed: z.boolean(),
  remediationLinks: z.array(z.object({
    questionId: z.string(),
    chunkRef: z.object({
      chunkId: z.string(),
      headingPath: z.string().optional(),
    }).optional(),
  })).optional(),
});

export type QuizGradingResponse = z.infer<typeof quizGradingResponseSchema>;

// iFlash generation request
export const iflashGenerationRequestSchema = z.object({
  lessonId: z.string(),
  chunkIds: z.array(z.string()).optional(),
});

export type IFlashGenerationRequest = z.infer<typeof iflashGenerationRequestSchema>;