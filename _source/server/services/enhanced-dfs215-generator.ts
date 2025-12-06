import OpenAI from 'openai';
import { storage } from '../storage';
import type { Track, Module, Lesson, InsertLesson, InsertLessonCheckpoint } from '../../shared/schema';
import { db } from '../db';
import { lessonCheckpoints, lessons } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface DFS215Stage {
  title: string;
  type: 'survival_guide' | 'live_seminar' | 'law_integration' | 'applied_concept';
  content: string;
  checkpoints: DFS215Checkpoint[];
}

interface DFS215Checkpoint {
  type: 'intro' | 'objectives' | 'reading' | 'video' | 'iflash' | 'microquiz' | 'reflection' | 'completion';
  promptType: 'identify' | 'define' | 'contrast' | 'compare' | 'discuss' | 'note' | 'illustration';
  title: string;
  content: string;
  examRelevance: number; // Weighted percentage
}

interface ExamWeighting {
  domain: string;
  percentage: number;
  topics: string[];
}

export class EnhancedDFS215Generator {
  
  private examWeightings: ExamWeighting[] = [
    {
      domain: "Insurance Law & Ethics",
      percentage: 13,
      topics: [
        "Florida Department of Financial Services (DFS) authority",
        "Agent licensing and appointment procedures", 
        "Continuing education requirements",
        "Professional responsibility and fiduciary duty",
        "Misappropriation penalties and enforcement",
        "CFO jurisdiction and regulatory powers"
      ]
    },
    {
      domain: "Health Insurance",
      percentage: 25,
      topics: [
        "Managed Care structures (HMO, PPO, EPO, POS)",
        "Buyers Guide Analysis and disclosure requirements",
        "Affordable Care Act provisions",
        "Balance billing restrictions and rate regulation",
        "DFS enforcement and FIGA protections",
        "Essential health benefits and grandfathered plans"
      ]
    },
    {
      domain: "Life Insurance & Annuities", 
      percentage: 40,
      topics: [
        "Term Life: renewable, convertible, decreasing, increasing",
        "Whole Life: level premiums, prepaid mortality, tax-favored status",
        "Universal Life: flexible premiums, corridor features",
        "Variable Products: separate accounts, prospectus disclosure",
        "Annuities: fixed, variable, immediate, deferred",
        "Modified Endowment Contracts (TAMRA compliance)"
      ]
    },
    {
      domain: "Social Insurance & Disability",
      percentage: 22,
      topics: [
        "OASDI: retirement, survivor, disability benefits",
        "Medicare Parts A-D, deductibles, benefit periods",
        "Medicaid: long-term care, look-back periods",
        "Disability Income: short vs long-term, elimination periods",
        "AD&D: principal vs capital sum, special risk coverage",
        "Medigap supplements and dual eligibility"
      ]
    }
  ];

  /**
   * Generate enhanced DFS-215 content with structured framework
   */
  async generateEnhancedContent(): Promise<void> {
    console.log('🏛️ DFS-215 Enhanced Encyclopedia Framework Generation');
    console.log('📚 Implementing structured stages and checkpoint system...\n');
    
    const tracks = await storage.getTracks();
    
    for (const track of tracks) {
      const examWeight = this.getExamWeighting(track.title);
      if (examWeight) {
        console.log(`\n📖 Enhancing: ${track.title} (${examWeight.percentage}% exam weight)`);
        await this.enhanceTrackWithStructure(track, examWeight);
      }
    }
    
    console.log('\n✅ Enhanced DFS-215 content generation completed!');
  }

  private getExamWeighting(trackTitle: string): ExamWeighting | undefined {
    return this.examWeightings.find(weight => 
      trackTitle.toLowerCase().includes(weight.domain.toLowerCase().split(' ')[0]) ||
      weight.domain.toLowerCase().includes(trackTitle.toLowerCase().split(' ')[0])
    );
  }

  private async enhanceTrackWithStructure(track: Track, examWeight: ExamWeighting): Promise<void> {
    const modules = await storage.getModulesByTrack(track.id);
    
    for (const module of modules) {
      console.log(`  📄 Enhancing module: ${module.title}`);
      await this.enhanceModuleWithStages(track, module, examWeight);
    }
  }

  private async enhanceModuleWithStages(track: Track, module: Module, examWeight: ExamWeighting): Promise<void> {
    // Generate comprehensive lesson content with DFS-215 structure
    const enhancedPrompt = this.buildDFS215StructuredPrompt(track, module, examWeight);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are creating the official DFS-215 Blended Self-Study Course content for Florida insurance professionals. This content must match Encyclopedia Britannica quality while following the official DFS-215 pedagogical framework.

CRITICAL DFS-215 STRUCTURE REQUIREMENTS:
- Use the 4-component instructional framework: iFlash4u Survival Guides, iPower Moves LIVE Seminars, DFS Law Integration, Applied Concept Modules
- Include coded checkpoint prompts: [Identify], [Define], [Contrast], [Compare], [Discuss], [Note], [Illustration]
- Structure content into stages (thematic blocks) and checkpoints (testable tasks)
- Emphasize exam relevance with specific weightings
- Use professional, graduate-level academic language
- Include comprehensive coverage with detailed explanations

This is NOT abbreviated content - provide COMPLETE encyclopedia-level detail for professional certification.`
          },
          {
            role: "user", 
            content: enhancedPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2, // Lower for precision
      });

      const generatedContent = response.choices[0]?.message?.content;
      
      if (generatedContent) {
        await this.createEnhancedLessonsWithCheckpoints(track, module, generatedContent, examWeight);
      }
      
    } catch (error) {
      console.error(`Error generating enhanced content for ${module.title}:`, error);
    }
  }

  private buildDFS215StructuredPrompt(track: Track, module: Module, examWeight: ExamWeighting): string {
    return `Generate enhanced DFS-215 Blended Self-Study Course content following the official pedagogical framework:

**TRACK:** ${track.title}
**MODULE:** ${module.title}
**EXAM WEIGHT:** ${examWeight.percentage}% of Florida insurance licensing exam
**DESCRIPTION:** ${module.description}

**REQUIRED DFS-215 FRAMEWORK:**

1. **iFlash4u Survival Guides Component:**
   - Pre-frame testable concepts with exam keywords
   - Include "roadmap" elements for upcoming lessons
   - Highlight state exam keywords and discussion points

2. **iPower Moves LIVE Seminar Component:**
   - Professional presentation standards
   - Compliance and sales ethics emphasis
   - Real-world application scenarios

3. **DFS Law and Regulatory Integration:**
   - Florida Department of Financial Services authority
   - Licensing standards and agent responsibilities
   - Continuing education requirements and procedures

4. **Applied Concept Modules:**
   - Policy structures and comparisons
   - Riders and key distinctions
   - Checkpoint quizzes and assessments

**CHECKPOINT CODING SYSTEM:**
Use these coded prompts throughout the content:
- [Identify] → Factual recognition and definitions
- [Define] → Terminology explanation
- [Contrast] / [Compare] → Side-by-side policy analysis
- [Discuss] → Applied reasoning in insurance law/ethics
- [Note] → High-priority memorization cues
- [Illustration] → Diagrammatic/visual references

**EXAM TOPICS TO COVER:**
${examWeight.topics.map(topic => `• ${topic}`).join('\n')}

**CONTENT STRUCTURE:**
Create 2-3 comprehensive lessons with this JSON format:
{
  "lessons": [
    {
      "title": "Professional Lesson Title",
      "slug": "lesson-slug", 
      "objectives": ["Graduate-level learning objectives"],
      "duration": 60,
      "ceHours": ${track.title.includes("Law & Ethics") ? 1.0 : 0.5},
      "content": "# Encyclopedia-quality content with DFS-215 structure...",
      "stages": [
        {
          "title": "Stage Title",
          "type": "survival_guide|live_seminar|law_integration|applied_concept",
          "checkpoints": [
            {
              "type": "reading|iflash|microquiz",
              "promptType": "identify|define|contrast|compare|discuss|note|illustration", 
              "title": "Checkpoint Title",
              "content": "Detailed checkpoint content"
            }
          ]
        }
      ]
    }
  ]
}

Generate COMPLETE, comprehensive content - no abbreviations. This is professional certification at Encyclopedia Britannica quality standards.`;
  }

  private async createEnhancedLessonsWithCheckpoints(
    track: Track, 
    module: Module, 
    content: string, 
    examWeight: ExamWeighting
  ): Promise<void> {
    try {
      const parsed = JSON.parse(content);
      
      if (parsed.lessons && Array.isArray(parsed.lessons)) {
        let orderIndex = 1;
        
        for (const lessonData of parsed.lessons) {
          // Create the lesson
          const lesson: InsertLesson = {
            moduleId: module.id,
            title: lessonData.title,
            slug: lessonData.slug,
            description: lessonData.content.substring(0, 200) + '...',
            content: lessonData.content,
            objectives: lessonData.objectives || [],
            orderIndex: orderIndex++,
            duration: lessonData.duration || 60,
            ceHours: lessonData.ceHours || 0,
            isActive: true,
            published: true,
            visibility: 'public'
          };

          const createdLesson = await storage.createLesson(lesson);
          console.log(`    ✅ Enhanced lesson: ${lesson.title}`);

          // Create structured checkpoints if provided
          if (lessonData.stages && Array.isArray(lessonData.stages)) {
            await this.createDFS215Checkpoints(createdLesson.id, lessonData.stages);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing enhanced content:', error);
      
      // Fallback: enhance existing lesson
      await this.enhanceExistingLesson(track, module, content, examWeight);
    }
  }

  private async createDFS215Checkpoints(lessonId: string, stages: any[]): Promise<void> {
    let checkpointOrder = 1;
    
    for (const stage of stages) {
      if (stage.checkpoints && Array.isArray(stage.checkpoints)) {
        for (const checkpoint of stage.checkpoints) {
          const checkpointData: InsertLessonCheckpoint = {
            lessonId,
            type: checkpoint.type as any,
            title: `[${checkpoint.promptType.toUpperCase()}] ${checkpoint.title}`,
            bodyMd: checkpoint.content,
            orderIndex: checkpointOrder++,
            gate: checkpoint.promptType === 'note' ? { highlight: true } : {}
          };

          await db.insert(lessonCheckpoints).values(checkpointData);
          console.log(`      📍 Created checkpoint: [${checkpoint.promptType}] ${checkpoint.title}`);
        }
      }
    }
  }

  private async enhanceExistingLesson(
    track: Track, 
    module: Module, 
    content: string, 
    examWeight: ExamWeighting
  ): Promise<void> {
    // Get existing lessons for this module
    const existingLessons = await storage.getLessonsByModule(module.id);
    
    if (existingLessons.length > 0) {
      // Enhance the first lesson with structured content
      const lessonToEnhance = existingLessons[0];
      
      // Update with enhanced content
      await db.update(lessons)
        .set({
          content: content,
          objectives: [
            `Master ${examWeight.domain} concepts (${examWeight.percentage}% exam weight)`,
            `Apply DFS-215 structured learning framework`,
            `Demonstrate professional competency in ${track.title.toLowerCase()}`
          ],
          duration: 75,
          ceHours: track.title.includes("Law & Ethics") ? 1.0 : 0.5
        })
        .where(eq(lessons.id, lessonToEnhance.id));
        
      console.log(`    ✅ Enhanced existing lesson: ${lessonToEnhance.title}`);
    }
  }

  /**
   * Enhance specific track with DFS-215 structure
   */
  async enhanceSpecificTrack(trackTitle: string): Promise<void> {
    const tracks = await storage.getTracks();
    const track = tracks.find(t => t.title.toLowerCase().includes(trackTitle.toLowerCase()));
    
    if (!track) {
      throw new Error(`Track not found: ${trackTitle}`);
    }
    
    const examWeight = this.getExamWeighting(track.title);
    if (examWeight) {
      console.log(`🏛️ Enhancing: ${track.title} with DFS-215 framework`);
      await this.enhanceTrackWithStructure(track, examWeight);
    }
  }
}

export const enhancedDFS215Generator = new EnhancedDFS215Generator();