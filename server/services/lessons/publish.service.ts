import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { lessons, tracks, modules, type Lesson } from "../../../../../shared/schema";

interface PublishLessonInput {
  trackId: string;
  moduleId: string;
  lessonId: string;
  title: string;
}

interface PublishLessonOutput {
  slug: string;
  published: boolean;
  visibility: string;
}

export class PublishService {
  /**
   * Generate a deterministic slug from module + lesson title
   * Following kebab-case convention, limited to 64 characters
   */
  private generateSlug(moduleTitle: string, lessonTitle: string): string {
    const combined = `${moduleTitle}-${lessonTitle}`;
    
    return combined
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 64); // Limit to 64 characters
  }

  /**
   * Check if slug is unique within the tenant/system
   */
  private async isSlugUnique(slug: string, excludeLessonId?: string): Promise<boolean> {
    const query = db.select().from(lessons).where(eq(lessons.slug, slug));
    
    if (excludeLessonId) {
      // Exclude current lesson from uniqueness check (for updates)
      const existingLessons = await query;
      return !existingLessons.some((lesson: Lesson) => lesson.id !== excludeLessonId);
    }
    
    const existing = await query;
    return existing.length === 0;
  }

  /**
   * Generate a unique slug by appending numbers if needed
   */
  private async generateUniqueSlug(moduleTitle: string, lessonTitle: string, excludeLessonId?: string): Promise<string> {
    let baseSlug = this.generateSlug(moduleTitle, lessonTitle);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (!(await this.isSlugUnique(uniqueSlug, excludeLessonId))) {
      // Append counter to make unique, keeping within 64 char limit
      const suffix = `-${counter}`;
      const maxBaseLength = 64 - suffix.length;
      uniqueSlug = baseSlug.slice(0, maxBaseLength) + suffix;
      counter++;
    }

    return uniqueSlug;
  }

  /**
   * Publish a lesson with slug generation and visibility settings
   */
  async publishLesson(input: PublishLessonInput): Promise<PublishLessonOutput> {
    // Get module title for slug generation
    const module = await db.select()
      .from(modules)
      .where(eq(modules.id, input.moduleId))
      .limit(1);

    if (!module.length) {
      throw new Error(`Module not found: ${input.moduleId}`);
    }

    const moduleTitle = module[0].title;

    // Generate unique slug
    const slug = await this.generateUniqueSlug(moduleTitle, input.title, input.lessonId);

    // Update lesson with publishing info
    const updateResult = await db.update(lessons)
      .set({
        slug,
        published: true,
        visibility: 'public'
      })
      .where(eq(lessons.id, input.lessonId))
      .returning({
        id: lessons.id,
        slug: lessons.slug,
        published: lessons.published,
        visibility: lessons.visibility
      });

    if (!updateResult.length) {
      throw new Error(`Failed to publish lesson: ${input.lessonId}`);
    }

    return {
      slug: updateResult[0].slug!,
      published: updateResult[0].published!,
      visibility: updateResult[0].visibility!
    };
  }

  /**
   * Batch publish multiple lessons
   */
  async publishLessons(inputs: PublishLessonInput[]): Promise<PublishLessonOutput[]> {
    const results: PublishLessonOutput[] = [];

    for (const input of inputs) {
      try {
        const result = await this.publishLesson(input);
        results.push(result);
      } catch (error) {
        console.error(`Failed to publish lesson ${input.lessonId}:`, error);
        // Continue with other lessons
      }
    }

    return results;
  }

  /**
   * Get all published lessons with their slugs
   */
  async getPublishedLessons(): Promise<Array<{ id: string; slug: string; title: string }>> {
    const publishedLessons = await db.select({
      id: lessons.id,
      slug: lessons.slug,
      title: lessons.title
    })
    .from(lessons)
    .where(and(
      eq(lessons.published, true),
      eq(lessons.visibility, 'public')
    ));

    return publishedLessons.filter((lesson: { id: string; slug: string | null; title: string }) => lesson.slug); // Only include lessons with slugs
  }

  /**
   * Check lesson publication status
   */
  async isLessonPublished(lessonId: string): Promise<boolean> {
    const lesson = await db.select({
      published: lessons.published,
      visibility: lessons.visibility
    })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

    return lesson.length > 0 && lesson[0].published === true && lesson[0].visibility === 'public';
  }

  /**
   * Unpublish a lesson (set to draft)
   */
  async unpublishLesson(lessonId: string): Promise<void> {
    await db.update(lessons)
      .set({
        published: false,
        visibility: 'draft'
      })
      .where(eq(lessons.id, lessonId));
  }
}

export const publishService = new PublishService();