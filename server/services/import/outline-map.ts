import { storage } from "../../storage";
import type { ParsedNode } from './docx-parse';
import type { Track, Module, Lesson, InsertTrack, InsertModule, InsertLesson } from "@shared/schema";

export interface OutlineStructure {
  tracks: (InsertTrack & {
    modules: (InsertModule & {
      lessons: InsertLesson[];
    })[];
  })[];
}

export class OutlineMapper {
  async mapToLMSStructure(nodes: ParsedNode[]): Promise<OutlineStructure> {
    const structure: OutlineStructure = { tracks: [] };
    
    let currentTrack: any = null;
    let currentModule: any = null;
    let currentLesson: InsertLesson | null = null;
    let lessonContent: string[] = [];
    let trackOrder = 0;
    let moduleOrder = 0;
    let lessonOrder = 0;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      if (node.type === 'heading') {
        // H1 - Track level
        if (node.level === 1) {
          // Save previous lesson if exists
          if (currentLesson && currentModule) {
            currentLesson.content = lessonContent.join('\n\n');
            currentModule.lessons.push(currentLesson);
            lessonContent = [];
            currentLesson = null;
          }
          
          // Save previous module if exists
          if (currentModule && currentTrack) {
            currentTrack.modules.push(currentModule);
            currentModule = null;
          }
          
          // Save previous track if exists
          if (currentTrack) {
            structure.tracks.push(currentTrack);
          }
          
          // Create new track
          trackOrder++;
          moduleOrder = 0;
          const slug = this.generateSlug(node.text);
          const ceHours = this.getCEHours(node.text);
          
          currentTrack = {
            title: this.cleanTitle(node.text),
            slug,
            description: this.generateDescription(node.text),
            orderIndex: trackOrder,
            ceHours,
            isActive: true,
            modules: []
          };
        }
        // H2 - Module level
        else if (node.level === 2 && currentTrack) {
          // Save previous lesson if exists
          if (currentLesson && currentModule) {
            currentLesson.content = lessonContent.join('\n\n');
            currentModule.lessons.push(currentLesson);
            lessonContent = [];
            currentLesson = null;
          }
          
          // Save previous module if exists
          if (currentModule) {
            currentTrack.modules.push(currentModule);
          }
          
          // Create new module
          moduleOrder++;
          lessonOrder = 0;
          
          currentModule = {
            title: this.cleanTitle(node.text),
            slug: this.generateSlug(node.text),
            description: this.generateDescription(node.text),
            orderIndex: moduleOrder,
            lessons: []
          };
        }
        // H3 - Lesson level
        else if (node.level === 3 && currentModule) {
          // Save previous lesson if exists
          if (currentLesson) {
            currentLesson.content = lessonContent.join('\n\n');
            currentModule.lessons.push(currentLesson);
            lessonContent = [];
          }
          
          // Create new lesson
          lessonOrder++;
          const isCE = this.isCELesson(node.text, currentTrack?.title);
          const isPractice = this.isPracticeLesson(node.text);
          
          currentLesson = {
            title: this.cleanTitle(node.text),
            slug: this.generateSlug(node.text),
            description: this.generateDescription(node.text),
            content: '',
            orderIndex: lessonOrder,
            duration: this.estimateDuration(node.text),
            objectives: this.extractObjectives(nodes, i),
            ceHours: isCE ? 1 : 0,
            isActive: true
          };
        }
        // H4/H5 - Subsections within lesson
        else if ((node.level === 4 || node.level === 5) && currentLesson) {
          const level = node.level === 4 ? '##' : '###';
          lessonContent.push(`${level} ${node.text}`);
        }
      }
      // Regular content
      else if (node.type === 'content' && currentLesson) {
        lessonContent.push(node.text);
      }
    }
    
    // Save any remaining lesson, module, and track
    if (currentLesson && currentModule) {
      currentLesson.content = lessonContent.join('\n\n');
      currentModule.lessons.push(currentLesson);
    }
    
    if (currentModule && currentTrack) {
      currentTrack.modules.push(currentModule);
    }
    
    if (currentTrack) {
      structure.tracks.push(currentTrack);
    }
    
    return structure;
  }
  
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
  
  private cleanTitle(text: string): string {
    // Remove numbering and clean up
    return text
      .replace(/^[\d\.\-\s]+/, '')
      .replace(/^\s*\|?\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private generateDescription(title: string): string {
    // Generate meaningful descriptions based on title keywords
    const descriptions: { [key: string]: string } = {
      'law': 'Legal requirements, regulations, and compliance standards',
      'ethics': 'Professional responsibility and ethical guidelines',
      'health': 'Healthcare coverage, benefits, and insurance fundamentals',
      'managed care': 'HMO, PPO, EPO, and POS network models',
      'disability': 'Income protection and disability insurance coverage',
      'life': 'Life insurance products, underwriting, and benefits',
      'annuities': 'Fixed and variable annuity products and regulations',
      'social': 'Social Security, Medicare, and government programs',
      'oasdi': 'Old-Age, Survivors, and Disability Insurance programs',
      'figa': 'Florida Insurance Guaranty Association protections',
      'dfs': 'Department of Financial Services regulations',
      'cfo': 'Chief Financial Officer oversight and authority'
    };
    
    const lowerTitle = title.toLowerCase();
    for (const [key, desc] of Object.entries(descriptions)) {
      if (lowerTitle.includes(key)) {
        return desc;
      }
    }
    
    return `Comprehensive coverage of ${this.cleanTitle(title)}`;
  }
  
  private getCEHours(text: string): number {
    // Check for CE hour indicators
    if (text.includes('4-hr') || text.includes('4 hr')) return 4;
    if (text.includes('2-hr') || text.includes('2 hr')) return 2;
    if (text.includes('1-hr') || text.includes('1 hr')) return 1;
    if (text.toLowerCase().includes('law & ethics')) return 4;
    return 0;
  }
  
  private isCELesson(text: string, trackTitle?: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerTrack = trackTitle?.toLowerCase() || '';
    return (
      lowerText.includes('continuing education') ||
      lowerText.includes(' ce ') ||
      lowerText.includes('ce:') ||
      (lowerTrack.includes('law') && lowerTrack.includes('ethics'))
    );
  }
  
  private isPracticeLesson(text: string): boolean {
    const lowerText = text.toLowerCase();
    return (
      lowerText.includes('quiz') ||
      lowerText.includes('exam') ||
      lowerText.includes('practice') ||
      lowerText.includes('review questions') ||
      lowerText.includes('self-test')
    );
  }
  
  private estimateDuration(text: string): number {
    // Estimate reading duration in minutes
    if (this.isPracticeLesson(text)) return 30;
    if (text.toLowerCase().includes('overview')) return 10;
    if (text.toLowerCase().includes('introduction')) return 15;
    return 20; // Default duration
  }
  
  private extractObjectives(nodes: ParsedNode[], currentIndex: number): string[] {
    const objectives: string[] = [];
    
    // Look ahead for objectives or learning goals
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 10, nodes.length); i++) {
      const node = nodes[i];
      
      if (node.type === 'content') {
        if (node.text.includes('Identify') ||
            node.text.includes('Define') ||
            node.text.includes('Explain') ||
            node.text.includes('Understand') ||
            node.text.includes('Learn')) {
          objectives.push(node.text);
          if (objectives.length >= 3) break;
        }
      }
      
      // Stop if we hit another heading
      if (node.type === 'heading') break;
    }
    
    // Generate default objectives if none found
    if (objectives.length === 0) {
      objectives.push('Understand key concepts and terminology');
      objectives.push('Apply knowledge to real-world scenarios');
      objectives.push('Prepare for certification exam questions');
    }
    
    return objectives;
  }
  
  async saveStructure(structure: OutlineStructure): Promise<{
    tracks: number;
    modules: number;
    lessons: number;
  }> {
    let trackCount = 0;
    let moduleCount = 0;
    let lessonCount = 0;
    
    for (const trackData of structure.tracks) {
      // Check if track already exists
      const existingTracks = await storage.getTracks();
      let track = existingTracks.find(t => t.slug === trackData.slug);
      
      if (!track) {
        // Create new track
        const { modules, ...trackInsert } = trackData;
        track = await storage.createTrack(trackInsert);
        trackCount++;
        console.log(`Created track: ${track.title}`);
      } else {
        console.log(`Track already exists: ${track.title}`);
      }
      
      // Process modules
      for (const moduleData of trackData.modules) {
        const existingModules = await storage.getModulesByTrack(track.id);
        let module = existingModules.find(m => m.slug === moduleData.slug);
        
        if (!module) {
          // Create new module
          const { lessons, ...moduleInsert } = moduleData;
          module = await storage.createModule({
            ...moduleInsert,
            trackId: track.id
          });
          moduleCount++;
          console.log(`  Created module: ${module.title}`);
        } else {
          console.log(`  Module already exists: ${module.title}`);
        }
        
        // Process lessons
        for (const lessonData of moduleData.lessons) {
          const existingLessons = await storage.getLessonsByModule(module.id);
          const existingLesson = existingLessons.find(l => l.slug === lessonData.slug);
          
          if (!existingLesson) {
            // Create new lesson
            await storage.createLesson({
              ...lessonData,
              moduleId: module.id
            });
            lessonCount++;
            console.log(`    Created lesson: ${lessonData.title}`);
          } else {
            console.log(`    Lesson already exists: ${lessonData.title}`);
          }
        }
      }
    }
    
    return { tracks: trackCount, modules: moduleCount, lessons: lessonCount };
  }
}