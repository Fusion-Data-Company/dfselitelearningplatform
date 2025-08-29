import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { DocxParser } from './docx-parse';
import { OutlineMapper } from './outline-map';
import { ChunkEmbedder } from './chunk-embed';
import { QuestionExtractor } from './question-extract';
import { ExamBlueprintBuilder } from './exam-blueprint';
import { storage } from '../../storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ImportResult {
  tracks: number;
  modules: number;
  lessons: number;
  chunks: number;
  banks: number;
  questions: number;
  exams: number;
  version: string;
  errors: string[];
}

export class DFS215ImportService {
  private parser: DocxParser;
  private mapper: OutlineMapper;
  private chunker: ChunkEmbedder;
  private questionExtractor: QuestionExtractor;
  private examBuilder: ExamBlueprintBuilder;
  
  constructor() {
    this.parser = new DocxParser();
    this.mapper = new OutlineMapper();
    this.chunker = new ChunkEmbedder();
    this.questionExtractor = new QuestionExtractor();
    this.examBuilder = new ExamBlueprintBuilder();
  }
  
  async importFromDocx(docxPath?: string): Promise<ImportResult> {
    const result: ImportResult = {
      tracks: 0,
      modules: 0,
      lessons: 0,
      chunks: 0,
      banks: 0,
      questions: 0,
      exams: 0,
      version: `v1.0-dfs-215-${new Date().toISOString().split('T')[0]}`,
      errors: []
    };
    
    try {
      // Use provided path or default locations
      const filePath = docxPath || await this.findDocxFile();
      
      if (!filePath) {
        throw new Error('DOCX file not found. Please ensure the DFS-215 course file is available.');
      }
      
      console.log('='.repeat(60));
      console.log('DFS-215 CONTENT IMPORT STARTED');
      console.log('='.repeat(60));
      console.log(`Source: ${filePath}`);
      console.log(`Version: ${result.version}`);
      console.log('');
      
      // Phase 1: Parse DOCX
      console.log('Phase 1: Parsing DOCX document...');
      const nodes = await this.parser.parseToNodes(filePath);
      console.log(`  ✓ Parsed ${nodes.length} nodes`);
      
      if (nodes.length === 0) {
        throw new Error('No content found in DOCX file');
      }
      
      // Phase 2: Map to LMS structure
      console.log('\nPhase 2: Mapping to LMS structure...');
      const structure = await this.mapper.mapToLMSStructure(nodes);
      const saveResult = await this.mapper.saveStructure(structure);
      result.tracks = saveResult.tracks;
      result.modules = saveResult.modules;
      result.lessons = saveResult.lessons;
      console.log(`  ✓ Created ${result.tracks} tracks, ${result.modules} modules, ${result.lessons} lessons`);
      
      // Phase 3: Chunk content for AI/retrieval
      console.log('\nPhase 3: Chunking content for AI retrieval...');
      let totalChunks = 0;
      
      // Get all lessons and chunk their content
      const allTracks = await storage.getTracks();
      for (const track of allTracks) {
        const modules = await storage.getModulesByTrack(track.id);
        for (const module of modules) {
          const lessons = await storage.getLessonsByModule(module.id);
          for (const lesson of lessons) {
            if (lesson.content) {
              const chunks = await this.chunker.chunkAndEmbedLesson(lesson);
              const saved = await this.chunker.saveChunks(chunks);
              totalChunks += saved;
            }
          }
        }
      }
      result.chunks = totalChunks;
      console.log(`  ✓ Created ${result.chunks} content chunks`);
      
      // Phase 4: Extract questions
      console.log('\nPhase 4: Extracting questions from assessments...');
      const assessmentNodes = nodes.filter(node => 
        node.type === 'assessment' || 
        (node.metadata && node.metadata.isAssessment === true)
      );
      console.log(`  Found ${assessmentNodes.length} assessment sections`);
      
      const { banks, totalQuestions } = await this.questionExtractor.extractQuestions(nodes);
      const bankSaveResult = await this.questionExtractor.saveQuestionBanks(banks);
      result.banks = bankSaveResult.banksCreated;
      result.questions = bankSaveResult.questionsCreated;
      console.log(`  ✓ Created ${result.banks} question banks with ${result.questions} questions`);
      
      // Phase 5: Build exam configurations
      console.log('\nPhase 5: Building exam configurations...');
      
      // Build main DFS-215 exam
      const mainExam = await this.examBuilder.buildExamForm();
      if (mainExam.questionIds.length > 0) {
        await this.examBuilder.saveExamConfig(mainExam.config, mainExam.questionIds);
        result.exams++;
        console.log(`  ✓ Created main exam: ${mainExam.config.title}`);
      }
      
      // Build mini exams for each topic
      for (const [topicId] of banks.entries()) {
        if (banks.get(topicId)!.length >= 5) {
          try {
            const miniExam = await this.examBuilder.createMiniExam(topicId, 10);
            await this.examBuilder.saveExamConfig(miniExam.config, miniExam.questionIds);
            result.exams++;
            console.log(`  ✓ Created mini exam for ${topicId}`);
          } catch (error) {
            console.warn(`  ⚠ Could not create mini exam for ${topicId}`);
          }
        }
      }
      
      // Phase 6: Generate flashcards from key concepts
      console.log('\nPhase 6: Generating flashcards...');
      await this.generateFlashcards(nodes);
      console.log(`  ✓ Flashcard generation completed`);
      
      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('IMPORT COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log('Summary:');
      console.log(`  • Tracks: ${result.tracks}`);
      console.log(`  • Modules: ${result.modules}`);
      console.log(`  • Lessons: ${result.lessons}`);
      console.log(`  • Content Chunks: ${result.chunks}`);
      console.log(`  • Question Banks: ${result.banks}`);
      console.log(`  • Questions: ${result.questions}`);
      console.log(`  • Exams: ${result.exams}`);
      console.log(`  • Version: ${result.version}`);
      console.log('');
      console.log('✅ All content is now available in the application!');
      console.log('');
      
      // List first 10 lesson slugs for verification
      console.log('Sample lessons created:');
      const sampleLessons = await storage.getAllLessons();
      sampleLessons.slice(0, 10).forEach((lesson, index) => {
        console.log(`  ${index + 1}. /lesson/${lesson.slug}`);
      });
      
    } catch (error) {
      console.error('\n❌ Import failed:', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
    
    return result;
  }
  
  private async findDocxFile(): Promise<string | null> {
    // Direct path to the attached DOCX file (go up 3 levels from services/import)
    const primaryPath = path.resolve(__dirname, '../../../attached_assets/215 DFS Blended - Self Study Course July 2025_1756484400762.docx');
    
    try {
      await fs.access(primaryPath);
      console.log(`Found DOCX at: ${primaryPath}`);
      return primaryPath;
    } catch {
      // Try alternative path
    }
    
    // Check multiple possible locations from project root
    const possiblePaths = [
      '../../../attached_assets/215 DFS Blended - Self Study Course July 2025_1756441609064.docx',
      '../../../attached_assets/215 DFS Blended - Self Study Course July 2025.docx',
    ];
    
    for (const filePath of possiblePaths) {
      try {
        const fullPath = path.resolve(__dirname, filePath);
        await fs.access(fullPath);
        console.log(`Found DOCX at: ${fullPath}`);
        return fullPath;
      } catch {
        // File doesn't exist at this path, try next
      }
    }
    
    // Check attached_assets directory for any DOCX files
    try {
      const attachedDir = path.resolve(__dirname, '../../../attached_assets');
      const files = await fs.readdir(attachedDir);
      const docxFile = files.find(f => f.endsWith('.docx') && f.includes('215'));
      if (docxFile) {
        const fullPath = path.join(attachedDir, docxFile);
        console.log(`Found DOCX at: ${fullPath}`);
        return fullPath;
      }
    } catch (error) {
      console.error('Error searching for DOCX:', error);
    }
    
    return null;
  }
  
  private async generateFlashcards(nodes: any[]): Promise<void> {
    // Extract key definitions and concepts for flashcards
    const flashcards = [];
    
    for (const node of nodes) {
      if (node.type === 'content' && node.text) {
        // Look for definition patterns
        if (node.text.includes('Define') || node.text.includes('Identify')) {
          const parts = node.text.split(/[:\-–]/);
          if (parts.length >= 2) {
            const front = parts[0].trim();
            const back = parts.slice(1).join(' ').trim();
            
            if (front && back) {
              flashcards.push({
                front: front.replace(/^\[?\s*(Define|Identify)\s*\]?\s*/i, ''),
                back,
                tags: this.extractTags(node.text)
              });
            }
          }
        }
      }
    }
    
    // Save flashcards to iFlash system
    for (const card of flashcards.slice(0, 100)) { // Limit to first 100 for now
      try {
        await storage.createFlashcard({
          front: card.front,
          back: card.back,
          tags: card.tags,
          difficulty: 3, // Default difficulty
          nextReview: new Date(),
          interval: 1,
          easeFactor: 2.5,
          userId: 'system' // System-generated cards
        });
      } catch (error) {
        // Ignore individual card errors
      }
    }
    
    console.log(`    Generated ${flashcards.length} flashcards`);
  }
  
  private extractTags(text: string): string[] {
    const tags = [];
    
    // Extract topic-based tags
    if (text.toLowerCase().includes('law')) tags.push('law');
    if (text.toLowerCase().includes('ethics')) tags.push('ethics');
    if (text.toLowerCase().includes('health')) tags.push('health');
    if (text.toLowerCase().includes('insurance')) tags.push('insurance');
    if (text.toLowerCase().includes('managed care')) tags.push('managed-care');
    if (text.toLowerCase().includes('hmo')) tags.push('hmo');
    if (text.toLowerCase().includes('ppo')) tags.push('ppo');
    if (text.toLowerCase().includes('disability')) tags.push('disability');
    if (text.toLowerCase().includes('life')) tags.push('life');
    if (text.toLowerCase().includes('annuit')) tags.push('annuities');
    
    return tags.slice(0, 5); // Limit to 5 tags
  }
  
  async clearAllContent(): Promise<void> {
    console.log('Clearing all existing content...');
    
    // Clear in reverse order of dependencies
    await storage.clearAllFlashcards();
    await storage.clearAllQuestions();
    await storage.clearAllQuestionBanks();
    await storage.clearAllExamConfigs();
    await storage.clearAllContentChunks();
    await storage.clearAllLessons();
    await storage.clearAllModules();
    await storage.clearAllTracks();
    
    console.log('All content cleared successfully');
  }
}

// Export singleton instance
export const importService = new DFS215ImportService();