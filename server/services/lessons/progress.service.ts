import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import { lessonProgress, userProgress, lessons, lessonCheckpoints } from "../../../../../shared/schema";

interface CheckpointProgressData {
  checkpointId: string;
  completed: boolean;
  timeSpent: number;
  quizScore?: number;
  quizPassed?: boolean;
  reflection?: string;
}

interface CETrackingData {
  seatTimeSpent: number;
  tabBlurEvents: number;
  lastActiveTimestamp: string;
  certificateEligible: boolean;
}

interface LessonProgressSummary {
  lessonId: string;
  userId: string;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  progressPercent: number;
  totalTimeSpent: number;
  ceData?: CETrackingData;
  lastCheckpointCompleted: string | null;
  completed: boolean;
}

export class ProgressService {
  /**
   * Update progress for a specific checkpoint
   */
  async updateCheckpointProgress(
    userId: string,
    lessonId: string,
    data: CheckpointProgressData
  ): Promise<void> {
    try {
      // Check if progress record exists
      const existingProgress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.checkpointId, data.checkpointId)
          )
        )
        .limit(1);

      const progressData = {
        userId,
        lessonId,
        checkpointId: data.checkpointId,
        completed: data.completed,
        timeSpent: data.timeSpent,
        attemptData: {
          quizScore: data.quizScore,
          quizPassed: data.quizPassed,
          reflection: data.reflection,
          timestamp: new Date().toISOString(),
        },
        completedAt: data.completed ? new Date() : null,
      };

      if (existingProgress.length > 0) {
        // Update existing progress
        await db
          .update(lessonProgress)
          .set({
            ...progressData,
            timeSpent: (existingProgress[0].timeSpent || 0) + data.timeSpent, // Accumulate time
          })
          .where(eq(lessonProgress.id, existingProgress[0].id));
      } else {
        // Insert new progress record
        await db.insert(lessonProgress).values(progressData);
      }

      // Update overall lesson progress
      await this.updateLessonProgress(userId, lessonId);
      
      console.log(`✓ Checkpoint progress updated for ${userId}:${lessonId}:${data.checkpointId}`);
    } catch (error) {
      console.error("Error updating checkpoint progress:", error);
      throw error;
    }
  }

  /**
   * Calculate and update overall lesson progress based on checkpoint completions
   */
  async updateLessonProgress(userId: string, lessonId: string): Promise<void> {
    try {
      // Get all checkpoints for this lesson
      const checkpoints = await db
        .select()
        .from(lessonCheckpoints)
        .where(eq(lessonCheckpoints.lessonId, lessonId))
        .orderBy(lessonCheckpoints.orderIndex);

      // Get user's progress on these checkpoints
      const checkpointProgress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId)
          )
        );

      const completedCheckpoints = checkpointProgress.filter(cp => cp.completed).length;
      const totalCheckpoints = checkpoints.length;
      const progressPercent = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;
      const totalTimeSpent = checkpointProgress.reduce((sum, cp) => sum + (cp.timeSpent || 0), 0);
      const lessonCompleted = completedCheckpoints === totalCheckpoints && totalCheckpoints > 0;

      // Get lesson data for CE checking
      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      let ceData: CETrackingData | undefined;
      if (lesson.length > 0 && lesson[0].ceHours && lesson[0].ceHours > 0) {
        const minSeatTime = lesson[0].ceHours * 60 * 60; // Convert hours to seconds
        ceData = {
          seatTimeSpent: totalTimeSpent,
          tabBlurEvents: 0, // TODO: Track tab blur events
          lastActiveTimestamp: new Date().toISOString(),
          certificateEligible: totalTimeSpent >= minSeatTime && lessonCompleted
        };
      }

      // Update or insert overall lesson progress
      const existingProgress = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        )
        .limit(1);

      const lastCompletedCheckpoint = checkpointProgress
        .filter(cp => cp.completed)
        .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())[0];

      const overallProgressData = {
        userId,
        lessonId,
        completed: lessonCompleted,
        timeSpent: totalTimeSpent,
        progressPercent,
        lastAccessed: new Date(),
        metadata: ceData ? { ceData } : null,
      };

      if (existingProgress.length > 0) {
        await db
          .update(userProgress)
          .set(overallProgressData)
          .where(eq(userProgress.id, existingProgress[0].id));
      } else {
        await db.insert(userProgress).values(overallProgressData);
      }

      console.log(`✓ Lesson progress updated: ${progressPercent}% (${completedCheckpoints}/${totalCheckpoints})`);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive progress summary for a lesson
   */
  async getLessonProgressSummary(userId: string, lessonId: string): Promise<LessonProgressSummary> {
    try {
      // Get checkpoints
      const checkpoints = await db
        .select()
        .from(lessonCheckpoints)
        .where(eq(lessonCheckpoints.lessonId, lessonId))
        .orderBy(lessonCheckpoints.orderIndex);

      // Get checkpoint progress
      const checkpointProgress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId)
          )
        );

      // Get overall progress
      const overallProgress = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        )
        .limit(1);

      const completedCheckpoints = checkpointProgress.filter(cp => cp.completed).length;
      const totalCheckpoints = checkpoints.length;
      const progressPercent = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;
      const totalTimeSpent = checkpointProgress.reduce((sum, cp) => sum + (cp.timeSpent || 0), 0);
      const completed = completedCheckpoints === totalCheckpoints && totalCheckpoints > 0;

      const lastCompleted = checkpointProgress
        .filter(cp => cp.completed)
        .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0];

      // Extract CE data if available (from lesson progress attempt data)
      let ceData: CETrackingData | undefined;
      // CE data would be calculated from checkpoint progress records

      return {
        lessonId,
        userId,
        checkpointsCompleted: completedCheckpoints,
        totalCheckpoints,
        progressPercent,
        totalTimeSpent,
        ceData,
        lastCheckpointCompleted: lastCompleted?.checkpointId || null,
        completed
      };
    } catch (error) {
      console.error("Error getting lesson progress summary:", error);
      throw error;
    }
  }

  /**
   * Get user's progress on a specific checkpoint
   */
  async getCheckpointProgress(
    userId: string,
    lessonId: string,
    checkpointId: string
  ): Promise<CheckpointProgressData | null> {
    try {
      const progress = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.checkpointId, checkpointId)
          )
        )
        .limit(1);

      if (!progress.length) return null;

      const record = progress[0];
      const attemptData = record.attemptData as any;
      return {
        checkpointId: record.checkpointId!,
        completed: record.completed!,
        timeSpent: record.timeSpent || 0,
        quizScore: attemptData?.quizScore,
        quizPassed: attemptData?.quizPassed,
        reflection: attemptData?.reflection,
      };
    } catch (error) {
      console.error("Error getting checkpoint progress:", error);
      return null;
    }
  }

  /**
   * Get all completed checkpoints for a lesson
   */
  async getCompletedCheckpoints(userId: string, lessonId: string): Promise<string[]> {
    try {
      const completed = await db
        .select({ checkpointId: lessonProgress.checkpointId })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId),
            eq(lessonProgress.completed, true)
          )
        );

      return completed.map(record => record.checkpointId!).filter(Boolean);
    } catch (error) {
      console.error("Error getting completed checkpoints:", error);
      return [];
    }
  }

  /**
   * Reset lesson progress (for retaking)
   */
  async resetLessonProgress(userId: string, lessonId: string): Promise<void> {
    try {
      // Delete checkpoint progress
      await db
        .delete(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId)
          )
        );

      // Reset overall progress
      await db
        .delete(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        );

      console.log(`✓ Lesson progress reset for ${userId}:${lessonId}`);
    } catch (error) {
      console.error("Error resetting lesson progress:", error);
      throw error;
    }
  }

  /**
   * Track CE seat-time with tab visibility
   */
  async updateCESeatTime(
    userId: string,
    lessonId: string,
    timeSpent: number,
    wasTabVisible: boolean
  ): Promise<void> {
    try {
      // Only count time when tab was visible
      if (!wasTabVisible) {
        console.log(`⚠️  CE time not counted - tab was not visible`);
        return;
      }

      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      if (!lesson.length || !lesson[0].ceHours || lesson[0].ceHours <= 0) {
        return; // Not a CE lesson
      }

      // Get current progress
      const currentProgress = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        )
        .limit(1);

      // For now, CE time tracking will be simplified
      // We'll track total time in the userProgress.timeSpent field
      if (currentProgress.length > 0) {
        const newTotalTime = (currentProgress[0].timeSpent || 0) + timeSpent;
        const minRequiredTime = lesson[0].ceHours! * 60 * 60; // Convert to seconds

        await db
          .update(userProgress)
          .set({
            timeSpent: newTotalTime,
            lastAccessed: new Date()
          })
          .where(eq(userProgress.id, currentProgress[0].id));

        console.log(`✓ CE seat-time updated: ${Math.round(newTotalTime / 60)}min of ${lesson[0].ceHours! * 60}min required`);
      }
    } catch (error) {
      console.error("Error updating CE seat-time:", error);
      throw error;
    }
  }

  /**
   * Validate quiz answers and return score details
   */
  validateQuizAnswers(
    questions: Array<{ answerIndex: number }>,
    userAnswers: number[]
  ): {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    details: Array<{
      questionIndex: number;
      correct: boolean;
      userAnswer: number;
      correctAnswer: number;
    }>;
  } {
    const details: Array<{
      questionIndex: number;
      correct: boolean;
      userAnswer: number;
      correctAnswer: number;
    }> = [];

    let correctAnswers = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = userAnswers[i];
      const isCorrect = userAnswer === question.answerIndex;

      if (isCorrect) {
        correctAnswers++;
      }

      details.push({
        questionIndex: i,
        correct: isCorrect,
        userAnswer,
        correctAnswer: question.answerIndex
      });
    }

    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const passed = score >= 70; // 70% passing threshold

    return {
      score,
      totalQuestions: questions.length,
      correctAnswers,
      passed,
      details
    };
  }

  /**
   * Get aggregated CE progress for a user across all lessons
   */
  async getUserCEProgress(userId: string): Promise<{
    totalCEHours: number;
    completedCEHours: number;
    eligibleCEHours: number;
    lessonsWithCE: Array<{
      lessonId: string;
      lessonTitle: string;
      ceHours: number;
      completed: boolean;
      certificateEligible: boolean;
      seatTimeSpent: number;
    }>;
  }> {
    try {
      // Get all CE lessons
      const ceLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.ceHours, 0)); // Get lessons with CE hours > 0

      // Get user progress for these lessons
      const progressRecords = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));

      const lessonsWithCE = [];
      let totalCEHours = 0;
      let completedCEHours = 0;
      let eligibleCEHours = 0;

      for (const lesson of ceLessons) {
        if (!lesson.ceHours || lesson.ceHours <= 0) continue;

        totalCEHours += lesson.ceHours;

        const progress = progressRecords.find(p => p.lessonId === lesson.id);
        const metadata = (progress?.metadata as any) || {};
        const ceData = metadata.ceData || {
          seatTimeSpent: 0,
          certificateEligible: false
        };

        if (progress?.completed) {
          completedCEHours += lesson.ceHours;
        }

        if (ceData.certificateEligible) {
          eligibleCEHours += lesson.ceHours;
        }

        lessonsWithCE.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          ceHours: lesson.ceHours,
          completed: progress?.completed || false,
          certificateEligible: ceData.certificateEligible,
          seatTimeSpent: ceData.seatTimeSpent
        });
      }

      return {
        totalCEHours,
        completedCEHours,
        eligibleCEHours,
        lessonsWithCE
      };
    } catch (error) {
      console.error("Error getting user CE progress:", error);
      throw error;
    }
  }
}

export const progressService = new ProgressService();