import { db } from '../db';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { 
  stages, 
  checkpoints, 
  enhancedUserProgress,
  lessons,
  type Stage,
  type Checkpoint,
  type EnhancedUserProgress,
  type InsertStage,
  type InsertCheckpoint,
  type InsertEnhancedUserProgress
} from '@shared/schema';

export class EnhancedStorageService {

  /**
   * Create a new stage for a lesson
   */
  async createStage(stageData: InsertStage): Promise<Stage> {
    const [stage] = await db
      .insert(stages)
      .values(stageData)
      .returning();
    
    return stage;
  }

  /**
   * Create a new checkpoint for a stage
   */
  async createCheckpoint(checkpointData: InsertCheckpoint): Promise<Checkpoint> {
    const [checkpoint] = await db
      .insert(checkpoints)
      .values(checkpointData)
      .returning();
    
    return checkpoint;
  }

  /**
   * Get all stages for a lesson with their checkpoints
   */
  async getStagesWithCheckpoints(lessonId: string): Promise<(Stage & { checkpoints: Checkpoint[] })[]> {
    // Get stages for the lesson
    const lessonStages = await db
      .select()
      .from(stages)
      .where(eq(stages.lessonId, lessonId))
      .orderBy(stages.order);

    // Get checkpoints for all stages
    const stageIds = lessonStages.map(s => s.id);
    
    if (stageIds.length === 0) {
      return [];
    }

    const stageCheckpoints = await db
      .select()
      .from(checkpoints)
      .where(inArray(checkpoints.stageId, stageIds))
      .orderBy(checkpoints.order);

    // Group checkpoints by stage
    const checkpointsByStage = new Map<string, Checkpoint[]>();
    for (const checkpoint of stageCheckpoints) {
      if (!checkpointsByStage.has(checkpoint.stageId)) {
        checkpointsByStage.set(checkpoint.stageId, []);
      }
      checkpointsByStage.get(checkpoint.stageId)!.push(checkpoint);
    }

    // Combine stages with their checkpoints
    return lessonStages.map(stage => ({
      ...stage,
      checkpoints: checkpointsByStage.get(stage.id) || []
    }));
  }

  /**
   * Get user progress for a lesson
   */
  async getUserProgress(userId: string, lessonId: string): Promise<EnhancedUserProgress[]> {
    return await db
      .select()
      .from(enhancedUserProgress)
      .where(
        and(
          eq(enhancedUserProgress.userId, userId),
          eq(enhancedUserProgress.lessonId, lessonId)
        )
      );
  }

  /**
   * Update user progress for a checkpoint
   */
  async updateUserProgress(
    userId: string, 
    checkpointId: string, 
    progressData: Partial<InsertEnhancedUserProgress>
  ): Promise<EnhancedUserProgress> {
    // First, try to update existing progress
    const existing = await db
      .select()
      .from(enhancedUserProgress)
      .where(
        and(
          eq(enhancedUserProgress.userId, userId),
          eq(enhancedUserProgress.checkpointId, checkpointId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing progress
      const [updated] = await db
        .update(enhancedUserProgress)
        .set({ 
          ...progressData, 
          updatedAt: sql`now()` 
        })
        .where(eq(enhancedUserProgress.id, existing[0].id))
        .returning();
      
      return updated;
    } else {
      // Create new progress record
      const [created] = await db
        .insert(enhancedUserProgress)
        .values({
          userId,
          checkpointId,
          ...progressData
        } as InsertEnhancedUserProgress)
        .returning();
      
      return created;
    }
  }

  /**
   * Check if stage requirements are met for progression
   */
  async checkStageGating(
    userId: string, 
    stageId: string
  ): Promise<{ canProgress: boolean; reason?: string }> {
    // Get stage with its gating rules
    const [stage] = await db
      .select()
      .from(stages)
      .where(eq(stages.id, stageId))
      .limit(1);

    if (!stage) {
      return { canProgress: false, reason: 'Stage not found' };
    }

    // Get all checkpoints for this stage
    const stageCheckpoints = await db
      .select()
      .from(checkpoints)
      .where(eq(checkpoints.stageId, stageId))
      .orderBy(checkpoints.order);

    if (stageCheckpoints.length === 0) {
      return { canProgress: true }; // No checkpoints = no restrictions
    }

    // Get user progress for these checkpoints
    const checkpointIds = stageCheckpoints.map(c => c.id);
    const userProgressList = await db
      .select()
      .from(enhancedUserProgress)
      .where(
        and(
          eq(enhancedUserProgress.userId, userId),
          sql`${enhancedUserProgress.checkpointId} = ANY(${checkpointIds})`
        )
      );

    // Check gating rules
    const gateRule = stage.gateRule as any;
    const passedCheckpoints = userProgressList.filter(p => p.status === 'passed').length;
    const totalCheckpoints = stageCheckpoints.length;

    if (gateRule?.require_all === true || gateRule?.require_all === undefined) {
      // Require all checkpoints to be passed
      if (passedCheckpoints < totalCheckpoints) {
        return { 
          canProgress: false, 
          reason: `Must complete all ${totalCheckpoints} checkpoints (${passedCheckpoints}/${totalCheckpoints} done)` 
        };
      }
    } else if (gateRule?.min_passed) {
      // Require minimum number of checkpoints
      if (passedCheckpoints < gateRule.min_passed) {
        return { 
          canProgress: false, 
          reason: `Must complete at least ${gateRule.min_passed} checkpoints (${passedCheckpoints}/${gateRule.min_passed} done)` 
        };
      }
    }

    return { canProgress: true };
  }

  /**
   * Create a complete lesson structure with stages and checkpoints
   */
  async createLessonStructure(lessonId: string, structure: {
    stages: Array<{
      title: string;
      order: number;
      gateRule?: any;
      checkpoints: Array<{
        order: number;
        kind: 'ack' | 'task' | 'quiz' | 'short_answer';
        label?: string;
        prompt: string;
        choices?: any[];
        answerKey?: any;
        explain?: string;
        tags?: string[];
      }>;
    }>;
  }): Promise<void> {
    for (const stageData of structure.stages) {
      // Create stage
      const stage = await this.createStage({
        lessonId,
        order: stageData.order,
        title: stageData.title,
        gateRule: stageData.gateRule || { require_all: true }
      });

      // Create checkpoints for this stage
      for (const checkpointData of stageData.checkpoints) {
        await this.createCheckpoint({
          stageId: stage.id,
          order: checkpointData.order,
          kind: checkpointData.kind,
          label: checkpointData.label,
          prompt: checkpointData.prompt,
          choices: checkpointData.choices,
          answerKey: checkpointData.answerKey,
          explain: checkpointData.explain,
          tags: checkpointData.tags || []
        });
      }
    }
  }

  /**
   * Get lesson overview with progress statistics
   */
  async getLessonOverview(lessonId: string, userId?: string): Promise<{
    lesson: any;
    stages: Array<Stage & { 
      checkpoints: Checkpoint[]; 
      userProgress?: EnhancedUserProgress[];
      canAccess?: boolean;
    }>;
    overallProgress?: {
      totalCheckpoints: number;
      completedCheckpoints: number;
      passedCheckpoints: number;
      completionPercentage: number;
    };
  }> {
    // Get lesson info
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Get stages with checkpoints
    const stagesWithCheckpoints = await this.getStagesWithCheckpoints(lessonId);

    let result: any = {
      lesson,
      stages: stagesWithCheckpoints
    };

    // Add user progress if userId provided
    if (userId) {
      const userProgressList = await this.getUserProgress(userId, lessonId);
      
      // Group progress by checkpoint
      const progressByCheckpoint = new Map<string, EnhancedUserProgress>();
      for (const progress of userProgressList) {
        if (progress.checkpointId) {
          progressByCheckpoint.set(progress.checkpointId, progress);
        }
      }

      // Add progress to stages and checkpoints
      let totalCheckpoints = 0;
      let completedCheckpoints = 0;
      let passedCheckpoints = 0;

      for (let i = 0; i < result.stages.length; i++) {
        const stage = result.stages[i];
        const stageProgress: EnhancedUserProgress[] = [];
        
        for (const checkpoint of stage.checkpoints) {
          totalCheckpoints++;
          const checkpointProgress = progressByCheckpoint.get(checkpoint.id);
          
          if (checkpointProgress) {
            stageProgress.push(checkpointProgress);
            if (checkpointProgress.status !== 'pending') {
              completedCheckpoints++;
            }
            if (checkpointProgress.status === 'passed') {
              passedCheckpoints++;
            }
          }
        }

        result.stages[i].userProgress = stageProgress;

        // Check if user can access this stage (previous stages completed)
        if (i === 0) {
          result.stages[i].canAccess = true; // First stage is always accessible
        } else {
          const previousStageId = result.stages[i - 1].id;
          const gatingCheck = await this.checkStageGating(userId, previousStageId);
          result.stages[i].canAccess = gatingCheck.canProgress;
        }
      }

      // Add overall progress statistics
      result.overallProgress = {
        totalCheckpoints,
        completedCheckpoints,
        passedCheckpoints,
        completionPercentage: totalCheckpoints > 0 
          ? Math.round((passedCheckpoints / totalCheckpoints) * 100)
          : 0
      };
    }

    return result;
  }

  /**
   * Grade a quiz checkpoint automatically
   */
  async gradeQuizCheckpoint(
    userId: string,
    checkpointId: string,
    userAnswers: string[]
  ): Promise<{ score: number; passed: boolean; feedback: string }> {
    // Get checkpoint with answer key
    const [checkpoint] = await db
      .select()
      .from(checkpoints)
      .where(eq(checkpoints.id, checkpointId))
      .limit(1);

    if (!checkpoint || checkpoint.kind !== 'quiz') {
      throw new Error('Invalid quiz checkpoint');
    }

    const choices = checkpoint.choices as any[];
    const correctAnswers = choices
      .filter(choice => choice.correct)
      .map(choice => choice.id);

    // Calculate score
    const correctCount = userAnswers.filter(answer => 
      correctAnswers.includes(answer)
    ).length;
    
    const score = choices.length > 0 
      ? Math.round((correctCount / correctAnswers.length) * 100)
      : 0;
    
    const passed = score >= 70; // 70% pass threshold

    // Update user progress
    await this.updateUserProgress(userId, checkpointId, {
      status: passed ? 'passed' : 'failed',
      score,
      attempt: { userAnswers, correctAnswers, gradedAt: new Date().toISOString() }
    });

    return {
      score,
      passed,
      feedback: checkpoint.explain || (passed 
        ? 'Congratulations! You passed this checkpoint.' 
        : 'Please review the material and try again.')
    };
  }
}

export const enhancedStorage = new EnhancedStorageService();