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
  uniqueIndex,
  numeric
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced DFS-215 Production Schema
// Based on encyclopedia-grade data model for comprehensive checkpoint system

// ENUMS
export const checkpointKindEnum = pgEnum("checkpoint_kind", ["ack", "task", "quiz", "short_answer"]);
export const progressStatusEnum = pgEnum("progress_status", ["pending", "passed", "failed"]);

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

// CORE ENTITIES - DFS-215 Structure

// Track (Course) - Top level curriculum grouping
export const tracks = pgTable("tracks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  meta: jsonb("meta").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Module - Thematic grouping within a track
export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: uuid("track_id").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  order: integer("order"),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  meta: jsonb("meta").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  trackSlugUnique: uniqueIndex("idx_module_track_slug").on(table.trackId, table.slug),
  orderIndex: index("idx_module_track_order").on(table.trackId, table.order),
}));

// Lesson - Individual learning unit with rich content
export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: uuid("module_id").references(() => modules.id, { onDelete: "cascade" }).notNull(),
  order: integer("order"),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  html: text("html"), // Rich rendering content
  plain: text("plain"), // Text-only for search
  summary: text("summary"),
  meta: jsonb("meta").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  moduleSlugUnique: uniqueIndex("idx_lesson_module_slug").on(table.moduleId, table.slug),
  orderIndex: index("idx_lesson_module_order").on(table.moduleId, table.order),
}));

// Stage - Structured learning blocks within lessons (Survival Guide blocks)
export const stages = pgTable("stages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
  title: text("title"),
  gateRule: jsonb("gate_rule").notNull().default(sql`'{"require_all": true}'::jsonb`), // Gating policy
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  lessonOrderUnique: uniqueIndex("idx_stage_lesson_order").on(table.lessonId, table.order),
  orderIndex: index("idx_stage_lesson_order_idx").on(table.lessonId, table.order),
}));

// Checkpoint - Individual learning tasks/assessments within stages
export const checkpoints = pgTable("checkpoints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  stageId: uuid("stage_id").references(() => stages.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
  kind: checkpointKindEnum("kind").notNull(), // ack, task, quiz, short_answer
  label: text("label"), // e.g., "[Identify] Premium", "[Define] Hazard"
  prompt: text("prompt"), // Body/question/instruction
  choices: jsonb("choices"), // For quiz: [{id, text, correct}]
  answerKey: jsonb("answer_key"), // For short_answer/rubric, or normalized correct set
  explain: text("explain"), // Rationale/teaching moment
  tags: text("tags").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  stageOrderUnique: uniqueIndex("idx_checkpoint_stage_order").on(table.stageId, table.order),
  orderIndex: index("idx_checkpoint_stage_order_idx").on(table.stageId, table.order),
}));

// User Progress - Comprehensive progress tracking
export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // Map to auth system
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  stageId: uuid("stage_id").references(() => stages.id, { onDelete: "cascade" }),
  checkpointId: uuid("checkpoint_id").references(() => checkpoints.id, { onDelete: "cascade" }),
  status: progressStatusEnum("status").notNull().default("pending"),
  score: numeric("score"), // For quiz items
  attempt: jsonb("attempt"), // User's attempt data
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userCheckpointUnique: uniqueIndex("idx_progress_user_checkpoint").on(table.userId, table.checkpointId),
  userLessonIndex: index("idx_progress_user_lesson").on(table.userId, table.lessonId),
}));

// Lesson Embeddings - For semantic search (pgvector ready)
export const lessonEmbeddings = pgTable("lesson_embeddings", {
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  // Note: vector type would be added when pgvector is available
  // embedding: vector("embedding", { dimensions: 1536 }),
  embedding: text("embedding"), // Placeholder - will be vector(1536) in production
}, (table) => ({
  primaryKey: { name: "lesson_embeddings_pkey", columns: [table.lessonId, table.chunkIndex] },
}));

// Type exports
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;
export type Stage = typeof stages.$inferSelect;
export type InsertStage = typeof stages.$inferInsert;
export type Checkpoint = typeof checkpoints.$inferSelect;
export type InsertCheckpoint = typeof checkpoints.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;
export type LessonEmbedding = typeof lessonEmbeddings.$inferSelect;
export type InsertLessonEmbedding = typeof lessonEmbeddings.$inferInsert;

// Zod schemas for validation
export const insertTrackSchema = createInsertSchema(tracks);
export const insertModuleSchema = createInsertSchema(modules);
export const insertLessonSchema = createInsertSchema(lessons);
export const insertStageSchema = createInsertSchema(stages);
export const insertCheckpointSchema = createInsertSchema(checkpoints);
export const insertUserProgressSchema = createInsertSchema(userProgress);

// Type inferencing
export type InsertTrackType = z.infer<typeof insertTrackSchema>;
export type InsertModuleType = z.infer<typeof insertModuleSchema>;
export type InsertLessonType = z.infer<typeof insertLessonSchema>;
export type InsertStageType = z.infer<typeof insertStageSchema>;
export type InsertCheckpointType = z.infer<typeof insertCheckpointSchema>;
export type InsertUserProgressType = z.infer<typeof insertUserProgressSchema>;

// DFS-215 Specific Types
export interface DFS215Stage {
  title: string;
  order: number;
  gateRule: {
    require_all?: boolean;
    min_passed?: number;
  };
  checkpoints: DFS215Checkpoint[];
}

export interface DFS215Checkpoint {
  order: number;
  kind: "ack" | "task" | "quiz" | "short_answer";
  label?: string; // [Identify], [Define], [Contrast], etc.
  prompt: string;
  choices?: {
    id: string;
    text: string;
    correct?: boolean;
  }[];
  answerKey?: any;
  explain?: string;
  tags?: string[];
}

export interface DFS215Lesson {
  slug: string;
  title: string;
  order: number;
  html?: string;
  plain?: string;
  summary?: string;
  meta?: any;
  stages: DFS215Stage[];
}

export interface DFS215Module {
  slug: string;
  title: string;
  order: number;
  summary?: string;
  lessons: DFS215Lesson[];
}

export interface DFS215Track {
  slug: string;
  title: string;
  description?: string;
  meta?: any;
  modules: DFS215Module[];
}

// JSON Schema validation types
export const gateRuleSchema = z.object({
  require_all: z.boolean().default(true),
  min_passed: z.number().min(0).optional(),
}).passthrough();

export const checkpointChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean().optional(),
});

export const dfs215CheckpointSchema = z.object({
  order: z.number().min(1),
  kind: z.enum(["ack", "task", "quiz", "short_answer"]),
  label: z.string().optional(),
  prompt: z.string(),
  choices: z.array(checkpointChoiceSchema).optional(),
  answerKey: z.any().optional(),
  explain: z.string().optional(),
  tags: z.array(z.string()).default([]),
}).refine(
  (data) => data.kind !== "quiz" || data.choices,
  {
    message: "Quiz checkpoints must have choices",
    path: ["choices"],
  }
);

export const dfs215StageSchema = z.object({
  title: z.string().optional(),
  order: z.number().min(1),
  gateRule: gateRuleSchema,
  checkpoints: z.array(dfs215CheckpointSchema).min(1),
});

export const dfs215LessonSchema = z.object({
  slug: z.string(),
  title: z.string(),
  order: z.number().optional(),
  html: z.string().optional(),
  plain: z.string().optional(),
  summary: z.string().optional(),
  meta: z.record(z.any()).optional(),
  stages: z.array(dfs215StageSchema).min(1),
});

export const dfs215ModuleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  order: z.number().optional(),
  summary: z.string().optional(),
  lessons: z.array(dfs215LessonSchema),
});

export const dfs215TrackSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  meta: z.record(z.any()).optional(),
  modules: z.array(dfs215ModuleSchema),
});