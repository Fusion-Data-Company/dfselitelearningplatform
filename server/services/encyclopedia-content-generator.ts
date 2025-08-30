import OpenAI from 'openai';
import { storage } from '../storage';
import type { Track, Module, Lesson, InsertLesson } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface EncyclopediaModule {
  title: string;
  description: string;
  lessons: EncyclopediaLesson[];
}

interface EncyclopediaLesson {
  title: string;
  slug: string;
  content: string;
  objectives: string[];
  duration: number;
  ceHours: number;
}

export class EncyclopediaContentGenerator {
  
  /**
   * Generate comprehensive, MBA-level encyclopedia content for DFS-215
   * No token saving - complete, detailed coverage like Encyclopedia Britannica
   */
  async generateComprehensiveContent(): Promise<void> {
    console.log('🎓 Starting Encyclopedia-Quality Content Generation for DFS-215');
    console.log('📚 Generating MBA-level textbook quality material...');
    
    const tracks = await storage.getTracks();
    
    for (const track of tracks) {
      console.log(`\n📖 Generating comprehensive content for: ${track.title}`);
      await this.generateTrackContent(track);
    }
    
    console.log('\n✅ Encyclopedia content generation completed!');
  }

  private async generateTrackContent(track: Track): Promise<void> {
    // Get existing modules for this track
    const modules = await storage.getModulesByTrack(track.id);
    
    for (const module of modules) {
      console.log(`  📄 Generating lessons for module: ${module.title}`);
      await this.generateModuleContent(track, module);
    }
  }

  private async generateModuleContent(track: Track, module: Module): Promise<void> {
    // Generate comprehensive lesson content based on track and module
    const contentPrompt = this.buildEncyclopediaPrompt(track, module);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a distinguished professor of insurance and financial services writing for an elite MBA program. Create comprehensive, encyclopedia-quality educational content that matches the depth and rigor of Encyclopedia Britannica entries. 

CRITICAL REQUIREMENTS:
- Write COMPLETE, comprehensive content - do NOT abbreviate to save tokens
- Use academic, graduate-level language appropriate for insurance professionals
- Include detailed explanations, examples, case studies, and regulatory context
- Provide thorough coverage of all aspects - this is encyclopedia-level detail
- Focus on Florida DFS-215 exam requirements but with comprehensive academic depth
- Structure content with clear headings, subheadings, and detailed sections
- Include practical applications, regulatory compliance details, and industry context

This content will be used in a professional certification program, so maintain the highest academic standards.`
          },
          {
            role: "user", 
            content: contentPrompt
          }
        ],
        max_tokens: 4000, // Maximum tokens for comprehensive content
        temperature: 0.3, // Lower temperature for academic precision
      });

      const generatedContent = response.choices[0]?.message?.content;
      
      if (generatedContent) {
        await this.createLessonsFromContent(track, module, generatedContent);
      }
      
    } catch (error) {
      console.error(`Error generating content for ${module.title}:`, error);
    }
  }

  private buildEncyclopediaPrompt(track: Track, module: Module): string {
    const trackTopics = {
      "Law & Ethics": {
        "Professional Responsibility": [
          "Fiduciary duties and obligations",
          "Agent licensing requirements and continuing education",
          "Professional conduct standards and ethical guidelines", 
          "Client confidentiality and privacy protection",
          "Conflicts of interest identification and management",
          "Professional liability and malpractice prevention"
        ],
        "Misappropriation & Penalties": [
          "Premium handling and trust account management",
          "Criminal penalties for insurance fraud",
          "Civil penalties and regulatory sanctions",
          "Reporting requirements and documentation",
          "Investigation procedures and due process",
          "Rehabilitation and compliance programs"
        ],
        "Continuing Education Compliance": [
          "Florida CE requirements and deadlines",
          "Approved course providers and content standards",
          "Record keeping and audit procedures",
          "Exemptions and special circumstances",
          "Compliance monitoring and enforcement",
          "Professional development best practices"
        ]
      },
      "Health Insurance & Managed Care": {
        "Traditional vs Managed Care": [
          "Fee-for-service model analysis and cost structures",
          "Managed care evolution and market penetration",
          "Provider network development and management",
          "Cost containment strategies and effectiveness",
          "Quality metrics and outcome measurement",
          "Consumer choice and satisfaction analysis"
        ],
        "HMO/PPO/EPO/POS Models": [
          "Health Maintenance Organization structure and operation",
          "Preferred Provider Organization network management",
          "Exclusive Provider Organization benefits and limitations",
          "Point of Service plan flexibility and cost-sharing",
          "Provider contracting and compensation models",
          "Member enrollment and eligibility management"
        ],
        "Buyer's Guide Analysis": [
          "Policy comparison methodology and tools",
          "Disclosure requirements and consumer protection",
          "Coverage analysis and benefit evaluation",
          "Cost-sharing structure comparison",
          "Network adequacy and provider access",
          "Consumer education and decision support"
        ]
      }
      // Additional tracks would be added here...
    };

    const trackData = trackTopics[track.title as keyof typeof trackTopics];
    const topicList: string[] = trackData ? (trackData as any)[module.title] || [
      "Fundamental concepts and principles",
      "Regulatory framework and compliance",
      "Practical applications and case studies"
    ] : [
      "Fundamental concepts and principles",
      "Regulatory framework and compliance",
      "Practical applications and case studies"
    ];

    return `Generate comprehensive, encyclopedia-quality educational content for this insurance course module:

**Track:** ${track.title}
**Module:** ${module.title}
**Description:** ${module.description}

**Required Topics to Cover Comprehensively:**
${topicList.map((topic: string) => `• ${topic}`).join('\n')}

**Content Requirements:**
1. Create 3-4 detailed lessons for this module
2. Each lesson should be 2000-3000 words of comprehensive content
3. Include detailed learning objectives for each lesson
4. Provide thorough explanations with real-world examples
5. Include regulatory context specific to Florida insurance law
6. Add case studies and practical applications
7. Use academic language appropriate for MBA-level insurance professionals

**Format Instructions:**
Structure the response as JSON with this exact format:
{
  "lessons": [
    {
      "title": "Lesson Title",
      "slug": "lesson-slug",
      "objectives": ["Objective 1", "Objective 2", "Objective 3"],
      "duration": 45,
      "ceHours": 0.75,
      "content": "# Comprehensive lesson content in markdown format..."
    }
  ]
}

Generate COMPLETE, detailed content - do not abbreviate to save tokens. This is encyclopedia-level coverage for professional certification.`;
  }

  private async createLessonsFromContent(track: Track, module: Module, content: string): Promise<void> {
    try {
      // Parse the JSON response
      const parsed = JSON.parse(content);
      
      if (parsed.lessons && Array.isArray(parsed.lessons)) {
        let orderIndex = 1;
        
        for (const lessonData of parsed.lessons) {
          const lesson: InsertLesson = {
            moduleId: module.id,
            title: lessonData.title,
            slug: lessonData.slug,
            description: lessonData.content.substring(0, 200) + '...',
            content: lessonData.content,
            objectives: lessonData.objectives || [],
            orderIndex: orderIndex++,
            duration: lessonData.duration || 45,
            ceHours: lessonData.ceHours || 0,
            isActive: true,
            published: true,
            visibility: 'public'
          };

          await storage.createLesson(lesson);
          console.log(`    ✅ Created lesson: ${lesson.title}`);
        }
      }
    } catch (error) {
      console.error('Error parsing generated content:', error);
      
      // Fallback: create a single lesson with the raw content
      const lesson: InsertLesson = {
        moduleId: module.id,
        title: `${module.title} - Comprehensive Overview`,
        slug: `${module.title.toLowerCase().replace(/\s+/g, '-')}-overview`,
        description: `Comprehensive coverage of ${module.title}`,
        content: content,
        objectives: [
          `Understand the fundamental principles of ${module.title}`,
          `Analyze regulatory requirements and compliance`,
          `Apply knowledge to practical scenarios`
        ],
        orderIndex: 1,
        duration: 60,
        ceHours: track.title === "Law & Ethics" ? 1.0 : 0,
        isActive: true,
        published: true,
        visibility: 'public'
      };

      await storage.createLesson(lesson);
      console.log(`    ✅ Created fallback lesson: ${lesson.title}`);
    }
  }

  /**
   * Generate content for a specific track with enhanced detail
   */
  async generateSpecificTrackContent(trackTitle: string): Promise<void> {
    const tracks = await storage.getTracks();
    const track = tracks.find(t => t.title.includes(trackTitle));
    
    if (!track) {
      throw new Error(`Track not found: ${trackTitle}`);
    }
    
    console.log(`🎓 Generating enhanced content for: ${track.title}`);
    await this.generateTrackContent(track);
  }

  /**
   * Clear existing lesson content and regenerate
   */
  async regenerateTrackContent(trackId: string): Promise<void> {
    const modules = await storage.getModulesByTrack(trackId);
    
    for (const module of modules) {
      // Get existing lessons
      const lessons = await storage.getLessonsByModule(module.id);
      
      // Delete existing lessons
      for (const lesson of lessons) {
        await storage.deleteLesson(lesson.id);
      }
    }
    
    // Regenerate content
    const track = await storage.getTrack(trackId);
    if (track) {
      await this.generateTrackContent(track);
    }
  }
}

export const encyclopediaGenerator = new EncyclopediaContentGenerator();