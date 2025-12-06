import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { 
  lessons, 
  contentUnits, 
  lessonCheckpoints,
  type Lesson,
  type ContentUnit,
  type InsertContentUnit,
  type InsertLessonCheckpoint
} from "../../../../../shared/schema";

interface CheckpointMeta {
  ceMeta?: {
    hours: number;
    seatTimeMin?: number;
  };
}

export class CheckpointsService {
  /**
   * Extract objectives from lesson content (bulleted lists near the beginning)
   */
  private extractObjectives(content: string): string[] {
    const lines = content.split('\n');
    const objectives: string[] = [];
    let inObjectivesSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for objectives section headers
      if (trimmed.toLowerCase().includes('objective') || 
          trimmed.toLowerCase().includes('learning goal') ||
          trimmed.toLowerCase().includes('you will learn')) {
        inObjectivesSection = true;
        continue;
      }
      
      // If we're in objectives section, collect bullet points
      if (inObjectivesSection) {
        if (trimmed.match(/^[•\-\*]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
          const objective = trimmed.replace(/^[•\-\*\d\.\s]+/, '').trim();
          if (objective.length > 10) {
            objectives.push(objective);
          }
        } else if (trimmed.length > 0 && !trimmed.match(/^[•\-\*\d\.\s]/)) {
          // End of bulleted section
          break;
        }
      }
      
      // Stop after first 20 lines if no objectives found
      if (lines.indexOf(line) > 20 && !inObjectivesSection) {
        break;
      }
    }
    
    // If no explicit objectives found, create generic ones
    if (objectives.length === 0) {
      objectives.push("Understand key concepts and terminology");
      objectives.push("Apply knowledge to practical scenarios");
      objectives.push("Demonstrate comprehension through assessment");
    }
    
    return objectives.slice(0, 6); // Limit to 3-6 objectives
  }

  /**
   * Split content into reading segments based on H4 headings
   */
  private splitIntoReadingSegments(content: string, headingIndex?: any): Array<{ title: string; content: string; tokens: number }> {
    const segments: Array<{ title: string; content: string; tokens: number }> = [];
    
    if (headingIndex && headingIndex.h4Sections) {
      // Use existing heading index to split content
      for (const section of headingIndex.h4Sections) {
        if (section.content && section.content.length > 100) {
          segments.push({
            title: section.heading || `Reading Section ${segments.length + 1}`,
            content: section.content,
            tokens: Math.ceil(section.content.length / 4) // Rough token estimation
          });
        }
      }
    } else {
      // Split content by paragraphs and group into segments
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
      const segmentSize = Math.max(2, Math.ceil(paragraphs.length / 5)); // Aim for 3-7 segments
      
      for (let i = 0; i < paragraphs.length; i += segmentSize) {
        const segmentContent = paragraphs.slice(i, i + segmentSize).join('\n\n');
        if (segmentContent.length > 100) {
          segments.push({
            title: `Reading Section ${segments.length + 1}`,
            content: segmentContent,
            tokens: Math.ceil(segmentContent.length / 4)
          });
        }
      }
    }
    
    // Ensure we have at least 3 segments and at most 7
    if (segments.length < 3) {
      // If too few segments, split the largest one
      const largest = segments.reduce((max, seg, idx) => 
        seg.content.length > segments[max].content.length ? idx : max, 0);
      
      if (largest >= 0 && segments[largest].content.length > 500) {
        const content = segments[largest].content;
        const midpoint = content.length / 2;
        const splitPoint = content.indexOf('\n', midpoint);
        
        if (splitPoint > 0) {
          segments[largest] = {
            title: segments[largest].title + " (Part 1)",
            content: content.substring(0, splitPoint),
            tokens: Math.ceil(splitPoint / 4)
          };
          
          segments.splice(largest + 1, 0, {
            title: segments[largest].title.replace("Part 1", "Part 2"),
            content: content.substring(splitPoint),
            tokens: Math.ceil((content.length - splitPoint) / 4)
          });
        }
      }
    }
    
    return segments.slice(0, 7); // Limit to max 7 segments
  }

  /**
   * Detect video URLs in lesson content
   */
  private extractVideoUrl(content: string): string | undefined {
    const urlPatterns = [
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+/gi,
      /https?:\/\/youtu\.be\/[\w-]+/gi,
      /https?:\/\/vimeo\.com\/\d+/gi,
      /https?:\/\/.*\.mp4/gi
    ];
    
    for (const pattern of urlPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return undefined;
  }

  /**
   * Generate intro checkpoint content from lesson
   */
  private generateIntroContent(lesson: Lesson): string {
    const firstParagraph = lesson.content?.split('\n\n')[0] || '';
    
    return `# Welcome to ${lesson.title}

${lesson.description || firstParagraph.substring(0, 200) + '...'}

In this lesson, you'll work through structured learning stages designed to help you master the material effectively.

**Learning Path:**
- 📚 Review learning objectives
- 📖 Read through content sections
- 🎯 Complete practice activities
- ✅ Demonstrate understanding

Let's begin your learning journey!`;
  }

  /**
   * Generate reflection prompt based on lesson content
   */
  private generateReflectionPrompt(lesson: Lesson): string {
    return `# Reflection

Take a moment to reflect on what you've learned in "${lesson.title}".

**Consider these questions:**

1. What were the most important concepts you learned?
2. How might you apply this knowledge in practice?
3. What questions do you still have about this topic?
4. How does this lesson connect to other material you've studied?

*Write a brief reflection (2-3 sentences) about your key takeaways from this lesson.*`;
  }

  /**
   * Calculate minimum reading time based on token count
   */
  private calculateMinReadTime(tokens: number): number {
    // min(2, ceil(tokens/180)) minutes as specified
    return Math.min(2, Math.ceil(tokens / 180));
  }

  /**
   * Build checkpoints from lesson content and metadata
   */
  async buildFromLesson(
    lessonId: string, 
    md?: string, 
    headingIndex?: any, 
    meta?: CheckpointMeta
  ): Promise<void> {
    // Get lesson data
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
      
    if (!lesson.length) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }
    
    const lessonData = lesson[0];
    const content = md || lessonData.content || '';
    
    // Clear existing checkpoints
    await db.delete(lessonCheckpoints).where(eq(lessonCheckpoints.lessonId, lessonId));
    
    const checkpoints: InsertLessonCheckpoint[] = [];
    const checkpointIds: string[] = []; // Track checkpoint IDs for gating
    let orderIndex = 1;
    
    // 1. Intro checkpoint
    const introCheckpoint = {
      lessonId,
      type: 'intro' as const,
      title: 'Welcome',
      bodyMd: this.generateIntroContent(lessonData),
      orderIndex: orderIndex++
    };
    checkpoints.push(introCheckpoint);
    
    // 2. Objectives checkpoint
    const objectives = this.extractObjectives(content);
    const objectivesContent = `# Learning Objectives

By the end of this lesson, you will be able to:

${objectives.map(obj => `- ${obj}`).join('\n')}

**Ready to start learning?** Click "Next" to begin reading the material.`;

    const objectivesCheckpoint = {
      lessonId,
      type: 'objectives' as const,
      title: 'Learning Objectives',
      bodyMd: objectivesContent,
      orderIndex: orderIndex++
    };
    checkpoints.push(objectivesCheckpoint);
    
    // 3. Reading segments
    const readingSegments = this.splitIntoReadingSegments(content, headingIndex);
    
    for (const segment of readingSegments) {
      const minTime = this.calculateMinReadTime(segment.tokens);
      
      checkpoints.push({
        lessonId,
        type: 'reading' as const,
        title: segment.title,
        bodyMd: segment.content,
        orderIndex: orderIndex++,
        gate: { 
          minTimeMinutes: minTime
        }
      });
    }
    
    // 4. Video checkpoint (if video found)
    const videoUrl = this.extractVideoUrl(content);
    if (videoUrl) {
      checkpoints.push({
        lessonId,
        type: 'video' as const,
        title: 'Video Content',
        videoUrl,
        bodyMd: `# Video Learning

Watch this video to reinforce the concepts you've read about.

**Video Duration:** Please watch the complete video before proceeding.`,
        orderIndex: orderIndex++
      });
    }
    
    // 5. iFlash checkpoint (CTA to generate flashcards)
    const iflashContent = `# iFlash Study Cards

Create personalized flashcards from this lesson to reinforce your learning.

**Benefits of iFlash:**
- Spaced repetition for better retention
- Customized to your learning needs
- Quick review for exam preparation

Click "Generate Cards" to create flashcards from the content you just studied.`;

    checkpoints.push({
      lessonId,
      type: 'iflash' as const,
      title: 'Create Study Cards',
      bodyMd: iflashContent,
      orderIndex: orderIndex++
    });
    
    // 6. Microquiz checkpoint (placeholder - will be populated by question extraction)
    checkpoints.push({
      lessonId,
      type: 'microquiz' as const,
      title: 'Knowledge Check',
      bodyMd: `# Knowledge Check

Test your understanding of the key concepts from this lesson.

*Questions will be loaded shortly...*`,
      orderIndex: orderIndex++
    });
    
    // 7. Reflection checkpoint
    checkpoints.push({
      lessonId,
      type: 'reflection' as const,
      title: 'Reflection',
      bodyMd: this.generateReflectionPrompt(lessonData),
      orderIndex: orderIndex++
    });
    
    // 8. Completion checkpoint
    let completionContent = `# Congratulations!

You have successfully completed "${lessonData.title}".

**What you accomplished:**
- ✅ Reviewed learning objectives
- ✅ Read through all content sections
- ✅ Completed knowledge check
- ✅ Reflected on your learning`;

    // Add CE requirements if applicable
    if (meta?.ceMeta && meta.ceMeta.hours > 0) {
      completionContent += `\n\n**Continuing Education Credit:** ${meta.ceMeta.hours} hours`;
      
      if (meta.ceMeta.seatTimeMin) {
        completionContent += `\n*Minimum seat time required: ${meta.ceMeta.seatTimeMin} minutes*`;
      }
    }

    completionContent += `\n\n**Next Steps:**
- Review your flashcards regularly
- Apply what you learned in your work
- Continue to the next lesson when ready`;

    checkpoints.push({
      lessonId,
      type: 'completion' as const,
      title: 'Lesson Complete',
      bodyMd: completionContent,
      orderIndex: orderIndex++,
      gate: { 
        passingScore: 70, // Require 70% on microquiz
        ceRequirements: meta?.ceMeta
      }
    });
    
    // Insert all checkpoints
    for (const checkpoint of checkpoints) {
      await db.insert(lessonCheckpoints).values(checkpoint);
    }
    
    console.log(`✓ Created ${checkpoints.length} checkpoints for lesson: ${lessonData.title}`);
  }

  /**
   * Get checkpoints for a lesson
   */
  async getCheckpointsByLesson(lessonId: string) {
    return await db.select()
      .from(lessonCheckpoints)
      .where(eq(lessonCheckpoints.lessonId, lessonId))
      .orderBy(lessonCheckpoints.orderIndex);
  }

  /**
   * Update microquiz checkpoint with extracted questions
   */
  async updateMicroquizCheckpoint(lessonId: string, quiz: any): Promise<void> {
    const microquizCheckpoint = await db.select()
      .from(lessonCheckpoints)
      .where(and(
        eq(lessonCheckpoints.lessonId, lessonId),
        eq(lessonCheckpoints.type, 'microquiz')
      ))
      .limit(1);
      
    if (microquizCheckpoint.length > 0) {
      await db.update(lessonCheckpoints)
        .set({ 
          quiz,
          bodyMd: `# Knowledge Check

Test your understanding of the key concepts from this lesson.

**Instructions:**
- Read each question carefully
- Select the best answer
- You need 70% or higher to proceed
- You can retake the quiz if needed`
        })
        .where(eq(lessonCheckpoints.id, microquizCheckpoint[0].id));
    }
  }
}

export const checkpointsService = new CheckpointsService();