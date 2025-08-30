import { db } from '../db';
import { sql } from 'drizzle-orm';
import { storage } from '../storage';
import type { 
  Track as OldTrack, 
  Module as OldModule, 
  Lesson as OldLesson 
} from '@shared/schema';
import type {
  DFS215Track,
  DFS215Module, 
  DFS215Lesson,
  DFS215Stage,
  DFS215Checkpoint,
  InsertStage,
  InsertCheckpoint
} from '@shared/enhanced-schema';

export class SchemaMigrationService {
  
  /**
   * Safely migrate existing content to new DFS-215 structure
   * This preserves all existing content while adding the new structured format
   */
  async migrateToEnhancedSchema(): Promise<void> {
    console.log('🔄 Starting migration to enhanced DFS-215 schema...');
    
    try {
      // Check if enhanced tables exist, create if needed
      await this.ensureEnhancedTablesExist();
      
      // Migrate existing tracks, modules, and lessons
      const tracks = await storage.getTracks();
      console.log(`📊 Found ${tracks.length} tracks to migrate`);
      
      for (const track of tracks) {
        await this.migrateTrack(track);
      }
      
      console.log('✅ Migration to enhanced schema completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async ensureEnhancedTablesExist(): Promise<void> {
    console.log('🏗️ Ensuring enhanced schema tables exist...');
    
    // Create enums if they don't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkpoint_kind') THEN
          CREATE TYPE checkpoint_kind AS ENUM ('ack', 'task', 'quiz', 'short_answer');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
          CREATE TYPE progress_status AS ENUM ('pending', 'passed', 'failed');
        END IF;
      END $$;
    `);

    // Create stages table if it doesn't exist (using VARCHAR for compatibility)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id VARCHAR NOT NULL,
        "order" INTEGER NOT NULL,
        title TEXT,
        gate_rule JSONB NOT NULL DEFAULT '{"require_all": true}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT fk_stages_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        CONSTRAINT unique_stage_order UNIQUE (lesson_id, "order")
      );
    `);

    // Create checkpoints table if it doesn't exist (using VARCHAR for compatibility)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        stage_id VARCHAR NOT NULL,
        "order" INTEGER NOT NULL,
        kind checkpoint_kind NOT NULL,
        label TEXT,
        prompt TEXT,
        choices JSONB,
        answer_key JSONB,
        explain TEXT,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT fk_checkpoints_stage FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
        CONSTRAINT unique_checkpoint_order UNIQUE (stage_id, "order")
      );
    `);

    // Create enhanced user_progress table if it doesn't exist (using VARCHAR for compatibility)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_progress_enhanced (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        lesson_id VARCHAR NOT NULL,
        stage_id VARCHAR,
        checkpoint_id VARCHAR,
        status progress_status NOT NULL DEFAULT 'pending',
        score NUMERIC,
        attempt JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        CONSTRAINT fk_progress_stage FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
        CONSTRAINT fk_progress_checkpoint FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id) ON DELETE CASCADE,
        CONSTRAINT unique_user_checkpoint UNIQUE (user_id, checkpoint_id)
      );
    `);

    // Create indexes (separated to avoid multiple command issue)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_stages_lesson_order ON stages(lesson_id, "order")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_checkpoints_stage_order ON checkpoints(stage_id, "order")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_progress_enhanced_user_lesson ON user_progress_enhanced(user_id, lesson_id)`);

    console.log('✅ Enhanced schema tables ready');
  }

  private async migrateTrack(track: OldTrack): Promise<void> {
    console.log(`📚 Migrating track: ${track.title}`);
    
    const modules = await storage.getModulesByTrack(track.id);
    
    for (const module of modules) {
      await this.migrateModule(module);
    }
  }

  private async migrateModule(module: OldModule): Promise<void> {
    console.log(`  📄 Migrating module: ${module.title}`);
    
    const lessons = await storage.getLessonsByModule(module.id);
    
    for (const lesson of lessons) {
      await this.migrateLesson(lesson);
    }
  }

  private async migrateLesson(lesson: OldLesson): Promise<void> {
    console.log(`    📖 Migrating lesson: ${lesson.title}`);
    
    // Check if lesson already has stages
    const existingStages = await db.execute(sql`
      SELECT COUNT(*) as count FROM stages WHERE lesson_id = ${lesson.id}
    `);
    
    const stageCount = (existingStages as any)?.rows?.[0]?.count || 0;
    
    if (stageCount > 0) {
      console.log(`    ⏭️ Lesson already has ${stageCount} stages, skipping`);
      return;
    }

    // Create default stages and checkpoints from existing content
    await this.createDefaultStagesFromContent(lesson);
  }

  private async createDefaultStagesFromContent(lesson: OldLesson): Promise<void> {
    const stages = this.parseContentIntoStages(lesson);
    
    for (const stageData of stages) {
      // Create stage - properly escape special characters
      const stageResult = await db.execute(sql`
        INSERT INTO stages (lesson_id, "order", title, gate_rule)
        VALUES (${lesson.id}, ${stageData.order}, ${stageData.title || null}, ${JSON.stringify(stageData.gateRule)})
        RETURNING id
      `);
      
      const stageId = (stageResult as any)?.rows?.[0]?.id;
      
      // Create checkpoints for this stage
      for (const checkpointData of stageData.checkpoints) {
        // Safely escape and truncate content to prevent SQL issues
        const safeLabel = (checkpointData.label || '').substring(0, 200);
        const safePrompt = (checkpointData.prompt || '').substring(0, 2000);
        const safeExplain = (checkpointData.explain || '').substring(0, 1000);
        
        await db.execute(sql`
          INSERT INTO checkpoints (stage_id, "order", kind, label, prompt, choices, answer_key, explain, tags)
          VALUES (
            ${stageId}, 
            ${checkpointData.order}, 
            ${checkpointData.kind}::checkpoint_kind,
            ${safeLabel || null},
            ${safePrompt},
            ${checkpointData.choices ? JSON.stringify(checkpointData.choices) : null},
            ${checkpointData.answerKey ? JSON.stringify(checkpointData.answerKey) : null},
            ${safeExplain || null},
            ${checkpointData.tags || []}
          )
        `);
      }
      
      console.log(`      📍 Created stage "${stageData.title}" with ${stageData.checkpoints.length} checkpoints`);
    }
  }

  private parseContentIntoStages(lesson: OldLesson): DFS215Stage[] {
    const content = lesson.content || '';
    const stages: DFS215Stage[] = [];
    
    // Parse content for DFS-215 structure
    const sections = this.extractContentSections(content);
    
    let stageOrder = 1;
    
    // Introduction Stage
    stages.push({
      title: 'Introduction',
      order: stageOrder++,
      gateRule: { require_all: true },
      checkpoints: [{
        order: 1,
        kind: 'ack',
        label: '[Note] Lesson Overview',
        prompt: `Welcome to "${lesson.title}". This lesson covers comprehensive material for professional insurance education.`,
        explain: 'Acknowledge to proceed with the lesson content.'
      }]
    });

    // Content Stages
    if (sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const checkpoints: DFS215Checkpoint[] = [];
        
        // Parse for DFS-215 checkpoint patterns
        const identifyItems = this.extractCheckpoints(section.content, 'identify');
        const defineItems = this.extractCheckpoints(section.content, 'define');
        const contrastItems = this.extractCheckpoints(section.content, 'contrast');
        const discussItems = this.extractCheckpoints(section.content, 'discuss');
        
        let checkpointOrder = 1;
        
        // Add reading checkpoint
        checkpoints.push({
          order: checkpointOrder++,
          kind: 'ack',
          label: '[Note] Reading Material',
          prompt: section.content.substring(0, 500) + (section.content.length > 500 ? '...' : ''),
          explain: 'Read and understand the material before proceeding.'
        });
        
        // Add extracted checkpoints
        identifyItems.forEach(item => {
          checkpoints.push({
            order: checkpointOrder++,
            kind: 'task',
            label: '[Identify] ' + item.title,
            prompt: item.prompt,
            tags: ['identify', 'recognition']
          });
        });
        
        defineItems.forEach(item => {
          checkpoints.push({
            order: checkpointOrder++,
            kind: 'short_answer',
            label: '[Define] ' + item.title,
            prompt: item.prompt,
            tags: ['define', 'terminology']
          });
        });
        
        contrastItems.forEach(item => {
          checkpoints.push({
            order: checkpointOrder++,
            kind: 'task',
            label: '[Contrast] ' + item.title,
            prompt: item.prompt,
            tags: ['contrast', 'comparison']
          });
        });
        
        discussItems.forEach(item => {
          checkpoints.push({
            order: checkpointOrder++,
            kind: 'short_answer',
            label: '[Discuss] ' + item.title,
            prompt: item.prompt,
            tags: ['discuss', 'analysis']
          });
        });
        
        // Ensure at least one checkpoint per stage
        if (checkpoints.length === 1) {
          checkpoints.push({
            order: 2,
            kind: 'ack',
            label: '[Note] Key Concepts',
            prompt: 'Review the key concepts presented in this section.',
            explain: 'Ensure understanding before proceeding.'
          });
        }
        
        // Safely clean title to prevent SQL issues
        const safeTitle = (section.title || `Section ${i + 1}`).replace(/[^\w\s-]/g, '').substring(0, 100);
        
        stages.push({
          title: safeTitle,
          order: stageOrder++,
          gateRule: { require_all: true },
          checkpoints
        });
      }
    } else {
      // Fallback: create basic stages from content
      stages.push({
        title: 'Main Content',
        order: stageOrder++,
        gateRule: { require_all: true },
        checkpoints: [
          {
            order: 1,
            kind: 'ack',
            label: '[Note] Course Material',
            prompt: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
            explain: 'Read and understand the course material.'
          },
          {
            order: 2,
            kind: 'task',
            label: '[Identify] Key Concepts',
            prompt: `Identify the key concepts covered in "${lesson.title}".`,
            tags: ['identify', 'concepts']
          }
        ]
      });
    }

    // Completion Stage
    stages.push({
      title: 'Lesson Completion',
      order: stageOrder++,
      gateRule: { require_all: true },
      checkpoints: [{
        order: 1,
        kind: 'ack',
        label: '[Note] Lesson Complete',
        prompt: `You have completed "${lesson.title}". The knowledge gained will be essential for professional practice.`,
        explain: 'Acknowledge completion to proceed to the next lesson.'
      }]
    });

    return stages;
  }

  private extractContentSections(content: string): { title: string; content: string }[] {
    const sections: { title: string; content: string }[] = [];
    
    // Split by markdown headers
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };
    
    for (const line of lines) {
      if (line.startsWith('##') && !line.startsWith('###')) {
        // New section
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: line.replace(/^#+\s*/, '').trim(),
          content: ''
        };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    // Add final section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  private extractCheckpoints(
    content: string, 
    type: 'identify' | 'define' | 'contrast' | 'discuss'
  ): { title: string; prompt: string }[] {
    const pattern = new RegExp(`\\[\\s*${type}\\s*\\]([^\\[]*?)(?=\\[|$)`, 'gi');
    const matches = content.match(pattern) || [];
    
    return matches.map((match, index) => {
      const cleanMatch = match.replace(/^\[[^\]]+\]\s*/, '').trim();
      const title = cleanMatch.split(/[.!?]/)[0].substring(0, 50);
      
      return {
        title: title || `${type} item ${index + 1}`,
        prompt: this.generatePromptForType(type, cleanMatch)
      };
    });
  }

  private generatePromptForType(type: string, content: string): string {
    const cleanContent = content.substring(0, 200);
    
    switch (type) {
      case 'identify':
        return `Identify and explain: ${cleanContent}`;
      case 'define':
        return `Provide a comprehensive definition for: ${cleanContent}`;
      case 'contrast':
        return `Compare and contrast the following concepts: ${cleanContent}`;
      case 'discuss':
        return `Discuss the significance and application of: ${cleanContent}`;
      default:
        return cleanContent;
    }
  }

  /**
   * Validate migrated data integrity
   */
  async validateMigration(): Promise<boolean> {
    console.log('🔍 Validating migration...');
    
    try {
      // Check that all lessons have stages
      const lessonsWithoutStages = await db.execute(sql`
        SELECT l.id, l.title 
        FROM lessons l 
        LEFT JOIN stages s ON l.id = s.lesson_id 
        WHERE s.id IS NULL
      `);
      
      const lessonsCount = (lessonsWithoutStages as any)?.rowCount || 0;
      if (lessonsCount > 0) {
        console.log(`⚠️ Found ${lessonsCount} lessons without stages`);
        return false;
      }
      
      // Check that all stages have checkpoints
      const stagesWithoutCheckpoints = await db.execute(sql`
        SELECT s.id, s.title 
        FROM stages s 
        LEFT JOIN checkpoints c ON s.id = c.stage_id 
        WHERE c.id IS NULL
      `);
      
      const stagesCount = (stagesWithoutCheckpoints as any)?.rowCount || 0;
      if (stagesCount > 0) {
        console.log(`⚠️ Found ${stagesCount} stages without checkpoints`);
        return false;
      }
      
      console.log('✅ Migration validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Migration validation failed:', error);
      return false;
    }
  }
}

export const schemaMigration = new SchemaMigrationService();