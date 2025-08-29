import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  real,
  uuid,
  pgEnum,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course structure
export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: varchar("slug"),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  ceHours: real("ce_hours").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").references(() => tracks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: varchar("slug"),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: varchar("slug").notNull(),
  description: text("description"),
  content: text("content"),
  objectives: text("objectives").array(),
  orderIndex: integer("order_index").notNull(),
  duration: integer("duration"), // in minutes
  ceHours: real("ce_hours").default(0),
  isActive: boolean("is_active").default(true),
  published: boolean("published").default(false),
  visibility: varchar("visibility").default("draft"), // "draft", "public", "private"
  createdAt: timestamp("created_at").defaultNow(),
});

// Content units for lesson structure
export const contentUnits = pgTable("content_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // "markdown", "html", "video"
  content: text("content").notNull(),
  headingIndex: jsonb("heading_index"), // H4 sections for reading splits
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lesson checkpoints for guided learning
export const checkpointTypeEnum = pgEnum("checkpoint_type", ["intro", "objectives", "reading", "video", "iflash", "microquiz", "reflection", "completion"]);

export const lessonCheckpoints = pgTable("lesson_checkpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  type: checkpointTypeEnum("type").notNull(),
  title: text("title"),
  bodyMd: text("body_md"),
  videoUrl: text("video_url"),
  quiz: jsonb("quiz"), // QuizItem[] for microquizzes
  gate: jsonb("gate"), // { requires: string[] } for prerequisite checkpoints
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual checkpoint progress tracking
export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  checkpointId: varchar("checkpoint_id").references(() => lessonCheckpoints.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  timeSpent: integer("time_spent").default(0), // in seconds
  seatTimeMs: integer("seat_time_ms").default(0), // actual engaged time
  attemptData: jsonb("attempt_data"), // quiz responses, scroll position, etc.
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userLessonCheckpointUnique: uniqueIndex("idx_lesson_progress_user_lesson_checkpoint").on(
    table.userId, 
    table.lessonId, 
    table.checkpointId
  ),
}));

// Content chunks for retrieval
export const contentChunks = pgTable("content_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  content: text("content"),
  text: text("text"), // For backward compatibility
  tokens: integer("tokens"),
  headings: text("headings").array(),
  pageRef: integer("page_ref"),
  heading: text("heading"),
  orderIndex: integer("order_index").default(0),
  embedding: text("embedding"), // Keep as text for now
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Question banks and items
export const questionBanks = pgTable("question_banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: varchar("slug").unique(),
  description: text("description"),
  topicId: varchar("topic_id"),
  topics: text("topics").array(),
  blueprint: jsonb("blueprint"), // Topic weights and counts
  timeLimitSec: integer("time_limit_sec"),
  attemptPolicy: varchar("attempt_policy").default("unlimited"),
  shuffleQuestions: boolean("shuffle_questions").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionTypeEnum = pgEnum("question_type", ["mcq", "ms", "tf", "scenario", "cloze"]);
export const difficultyEnum = pgEnum("difficulty", ["E", "M", "H"]);

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankId: varchar("bank_id").references(() => questionBanks.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull(),
  stem: text("stem").notNull(),
  options: text("options").array(),
  answerKey: text("answer_key").notNull(),
  explanation: text("explanation"),
  loTags: text("lo_tags").array(),
  chunkRefs: text("chunk_refs").array(),
  difficulty: difficultyEnum("difficulty").notNull(),
  stats: jsonb("stats"), // {p, disc, exposure}
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress and attempts
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  timeSpent: integer("time_spent").default(0), // in seconds
  progressPercent: real("progress_percent").default(0),
  lastAccessed: timestamp("last_accessed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userLessonUnique: uniqueIndex("idx_user_progress_user_lesson").on(table.userId, table.lessonId),
}));

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  bankId: varchar("bank_id").references(() => questionBanks.id, { onDelete: "cascade" }),
  score: real("score"),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  timeSpent: integer("time_spent"), // in seconds
  responses: jsonb("responses"), // Array of question responses
  completed: boolean("completed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Flashcard system
export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // 'term', 'mcq', 'cloze'
  front: text("front"),
  back: text("back"),
  // MCQ-specific fields
  prompt: text("prompt"), // Question stem for MCQs
  options: jsonb("options").$type<string[]>(), // Array of choices for MCQs
  answerIndex: integer("answer_index"), // 0-based correct answer index
  rationale: text("rationale"), // Explanation for MCQs
  // Legacy/metadata
  sourceId: varchar("source_id"), // Reference to content chunk or lesson
  difficulty: real("difficulty").default(2.5), // SM-2 ease factor
  interval: integer("interval").default(1), // Days until next review
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review").defaultNow(),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcardReviews = pgTable("flashcard_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  cardId: varchar("card_id").references(() => flashcards.id, { onDelete: "cascade" }),
  grade: integer("grade").notNull(), // 0-3 (Again, Hard, Good, Easy)
  reviewedAt: timestamp("reviewed_at").defaultNow(),
});

// AI Agent configuration
export const agentProfiles = pgTable("agent_profiles", {
  id: varchar("id").primaryKey(),
  displayName: text("display_name").notNull(),
  model: varchar("model").notNull(),
  temperature: real("temperature").default(0.2),
  maxTokens: integer("max_tokens").default(768),
  systemPrompt: text("system_prompt").notNull(),
  guardrails: jsonb("guardrails"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentLogs = pgTable("agent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  agent: varchar("agent").notNull(),
  tool: varchar("tool"),
  traceId: varchar("trace_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CE tracking
export const ceRecords = pgTable("ce_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  hours: real("hours").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  certificateUrl: text("certificate_url"),
});

// Video attendance
export const videoAttendance = pgTable("video_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  duration: integer("duration"), // in seconds
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type ContentUnit = typeof contentUnits.$inferSelect;
export type LessonCheckpoint = typeof lessonCheckpoints.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type ContentChunk = typeof contentChunks.$inferSelect;
export type QuestionBank = typeof questionBanks.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type FlashcardReview = typeof flashcardReviews.$inferSelect;
export type AgentProfile = typeof agentProfiles.$inferSelect;
export type AgentLog = typeof agentLogs.$inferSelect;
export type CERecord = typeof ceRecords.$inferSelect;
export type VideoAttendance = typeof videoAttendance.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrackSchema = createInsertSchema(tracks).omit({ id: true, createdAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertContentUnitSchema = createInsertSchema(contentUnits).omit({ id: true, createdAt: true });
export const insertLessonCheckpointSchema = createInsertSchema(lessonCheckpoints).omit({ id: true, createdAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, createdAt: true });
export const insertQuestionBankSchema = createInsertSchema(questionBanks).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, startedAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true });
export const insertAgentProfileSchema = createInsertSchema(agentProfiles).omit({ updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertContentUnit = z.infer<typeof insertContentUnitSchema>;
export type InsertLessonCheckpoint = z.infer<typeof insertLessonCheckpointSchema>;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type InsertAgentProfile = z.infer<typeof insertAgentProfileSchema>;
