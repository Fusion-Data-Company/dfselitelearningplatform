import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { DocxParser, ParsedNode } from './docx-parse';
import { OutlineMapper } from './outline-map';
import { ChunkEmbedder } from './chunk-embed';
import { QuestionExtractor } from './question-extract';
import { ExamBlueprintBuilder } from './exam-blueprint';
import { storage } from '../../storage';
import { checkpointsService } from '../lessons/checkpoints.service';
import { microquizService } from '../lessons/microquiz.service';

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
  flashcards: number;
  version: string;
  errors: string[];
  documentsProcessed: string[];
}

// Document metadata for the 5 DFS-215 compliance documents
export interface DFSDocument {
  id: string;
  filename: string;
  title: string;
  pages: number;
  focus: string;
}

export const DFS_DOCUMENTS: DFSDocument[] = [
  {
    id: 'S1',
    filename: '240 (S1) iLaw - Correspondence - 2026.docx',
    title: 'Insurance Law & Regulations',
    pages: 135,
    focus: 'Insurance Law, DFS Authority, Licensing, Regulations'
  },
  {
    id: 'S2',
    filename: '240.(S2) Social Insurances - Correspondence - 2026.docx',
    title: 'Social Insurances',
    pages: 79,
    focus: 'OASDI, Medicare, Medicaid, Long-Term Care'
  },
  {
    id: 'S3',
    filename: '240.(S3) Medical Expense - Correspondence - 2026.docx',
    title: 'Medical Expense Insurance',
    pages: 121,
    focus: 'Basic & Major Medical, Healthcare Networks'
  },
  {
    id: 'S4',
    filename: '240.(S4) Disability Dismemberment - Correspondence - 2026.docx',
    title: 'Disability & Dismemberment',
    pages: 48,
    focus: 'Disability Income, AD&D, Risk Classifications'
  },
  {
    id: 'S5',
    filename: '240.(S5) Replacement Groups - Correspondence - 2026.docx',
    title: 'Replacement & Groups',
    pages: 22,
    focus: 'Group Insurance, Policy Replacement, COBRA'
  }
];

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
      flashcards: 0,
      version: `v1.0-dfs-215-${new Date().toISOString().split('T')[0]}`,
      errors: [],
      documentsProcessed: []
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
      
      // Phase 3: Chunk content for AI/retrieval (skip for now to avoid token limits)
      console.log('\nPhase 3: Chunking content for AI retrieval...');
      console.log('  ⚠️  Skipping embedding generation to avoid token limits');
      console.log('  Note: Full lesson content has been imported and is available');
      result.chunks = 0;
      
      // Phase 4: Create lesson checkpoints
      console.log('\nPhase 4: Creating lesson checkpoints...');
      const allLessons = await storage.getAllLessons();
      let checkpointsCreated = 0;
      
      for (const lesson of allLessons) {
        try {
          await checkpointsService.buildFromLesson(lesson.id, lesson.content);
          await microquizService.processLessonMicroquiz(lesson.id);
          checkpointsCreated++;
          console.log(`  ✓ Created checkpoints for: ${lesson.title}`);
        } catch (error) {
          console.warn(`  ⚠ Failed to create checkpoints for: ${lesson.title}`, error);
          result.errors.push(`Checkpoint creation failed for ${lesson.title}: ${error}`);
        }
      }
      console.log(`  ✓ Created checkpoints for ${checkpointsCreated} lessons`);
      
      // Phase 5: Extract questions
      console.log('\nPhase 5: Extracting questions from assessments...');
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
      
      // Phase 6: Build exam configurations
      console.log('\nPhase 6: Building exam configurations...');
      
      // Build main DFS-215 exam
      const mainExam = await this.examBuilder.buildExamForm();
      if (mainExam.questionIds.length > 0) {
        await this.examBuilder.saveExamConfig(mainExam.config, mainExam.questionIds);
        result.exams++;
        console.log(`  ✓ Created main exam: ${mainExam.config.title}`);
      }
      
      // Build mini exams for each topic
      for (const [topicId] of Array.from(banks.entries())) {
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
      const docxFile = files.find((f: string) => f.endsWith('.docx') && f.includes('215'));
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

  /**
   * Import all 5 DFS-215 compliance documents
   * This is the main entry point for full content integration
   */
  async importAllDFSDocuments(): Promise<ImportResult> {
    const result: ImportResult = {
      tracks: 0,
      modules: 0,
      lessons: 0,
      chunks: 0,
      banks: 0,
      questions: 0,
      exams: 0,
      flashcards: 0,
      version: `v2.0-dfs-215-full-${new Date().toISOString().split('T')[0]}`,
      errors: [],
      documentsProcessed: []
    };

    console.log('='.repeat(70));
    console.log('DFS-215 FULL CONTENT INTEGRATION - ALL 5 DOCUMENTS');
    console.log('='.repeat(70));
    console.log(`Version: ${result.version}`);
    console.log('');

    // Find all DFS documents
    const attachedDir = path.resolve(__dirname, '../../../attached_assets');
    const foundDocs: { doc: DFSDocument; path: string }[] = [];

    for (const doc of DFS_DOCUMENTS) {
      const docPath = path.join(attachedDir, doc.filename);
      try {
        await fs.access(docPath);
        foundDocs.push({ doc, path: docPath });
        console.log(`✓ Found ${doc.id}: ${doc.title}`);
      } catch {
        console.log(`✗ Missing ${doc.id}: ${doc.filename}`);
        result.errors.push(`Missing document: ${doc.filename}`);
      }
    }

    console.log(`\nFound ${foundDocs.length} of ${DFS_DOCUMENTS.length} documents\n`);

    if (foundDocs.length === 0) {
      result.errors.push('No DFS documents found in attached_assets folder');
      return result;
    }

    // Collect all nodes from all documents
    const allNodes: ParsedNode[] = [];
    const allFlashcardNodes: ParsedNode[] = [];

    for (const { doc, path: docPath } of foundDocs) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Processing ${doc.id}: ${doc.title}`);
      console.log(`${'─'.repeat(60)}`);
      console.log(`  File: ${doc.filename}`);
      console.log(`  Expected pages: ${doc.pages}`);
      console.log(`  Focus: ${doc.focus}`);

      try {
        const nodes = await this.parser.parseToNodes(docPath);
        console.log(`  ✓ Parsed ${nodes.length} nodes`);

        // Tag nodes with document source
        const taggedNodes = nodes.map(node => ({
          ...node,
          metadata: {
            ...node.metadata,
            documentId: doc.id,
            documentTitle: doc.title
          }
        }));

        allNodes.push(...taggedNodes);
        allFlashcardNodes.push(...taggedNodes);
        result.documentsProcessed.push(doc.id);
      } catch (error) {
        console.error(`  ✗ Failed to parse: ${error}`);
        result.errors.push(`Failed to parse ${doc.id}: ${error}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Total nodes collected: ${allNodes.length}`);
    console.log(`${'='.repeat(60)}\n`);

    // Phase 2: Map all content to LMS structure
    console.log('Phase 2: Mapping to LMS structure...');
    try {
      const structure = await this.mapper.mapToLMSStructure(allNodes);
      const saveResult = await this.mapper.saveStructure(structure);
      result.tracks = saveResult.tracks;
      result.modules = saveResult.modules;
      result.lessons = saveResult.lessons;
      console.log(`  ✓ Created ${result.tracks} tracks, ${result.modules} modules, ${result.lessons} lessons`);
    } catch (error) {
      console.error(`  ✗ Mapping failed: ${error}`);
      result.errors.push(`Mapping failed: ${error}`);
    }

    // Phase 3: Create lesson checkpoints
    console.log('\nPhase 3: Creating lesson checkpoints...');
    try {
      const allLessons = await storage.getAllLessons();
      let checkpointsCreated = 0;

      for (const lesson of allLessons) {
        try {
          await checkpointsService.buildFromLesson(lesson.id, lesson.content);
          await microquizService.processLessonMicroquiz(lesson.id);
          checkpointsCreated++;
        } catch (error) {
          // Silent fail for individual lessons
        }
      }
      console.log(`  ✓ Created checkpoints for ${checkpointsCreated} lessons`);
    } catch (error) {
      console.error(`  ✗ Checkpoint creation failed: ${error}`);
      result.errors.push(`Checkpoint creation failed: ${error}`);
    }

    // Phase 4: Extract questions
    console.log('\nPhase 4: Extracting questions from assessments...');
    try {
      const { banks } = await this.questionExtractor.extractQuestions(allNodes);
      const bankSaveResult = await this.questionExtractor.saveQuestionBanks(banks);
      result.banks = bankSaveResult.banksCreated;
      result.questions = bankSaveResult.questionsCreated;
      console.log(`  ✓ Created ${result.banks} question banks with ${result.questions} questions`);
    } catch (error) {
      console.error(`  ✗ Question extraction failed: ${error}`);
      result.errors.push(`Question extraction failed: ${error}`);
    }

    // Phase 5: Build exam configurations
    console.log('\nPhase 5: Building exam configurations...');
    try {
      const mainExam = await this.examBuilder.buildExamForm();
      if (mainExam.questionIds.length > 0) {
        await this.examBuilder.saveExamConfig(mainExam.config, mainExam.questionIds);
        result.exams++;
        console.log(`  ✓ Created main exam: ${mainExam.config.title}`);
      }
    } catch (error) {
      console.error(`  ✗ Exam building failed: ${error}`);
      result.errors.push(`Exam building failed: ${error}`);
    }

    // Phase 6: Generate flashcards with enhanced extraction
    console.log('\nPhase 6: Generating flashcards...');
    try {
      const flashcardCount = await this.generateEnhancedFlashcards(allFlashcardNodes);
      result.flashcards = flashcardCount;
      console.log(`  ✓ Generated ${flashcardCount} flashcards`);
    } catch (error) {
      console.error(`  ✗ Flashcard generation failed: ${error}`);
      result.errors.push(`Flashcard generation failed: ${error}`);
    }

    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('DFS-215 FULL IMPORT COMPLETED');
    console.log('='.repeat(70));
    console.log('Summary:');
    console.log(`  • Documents Processed: ${result.documentsProcessed.join(', ')}`);
    console.log(`  • Tracks: ${result.tracks}`);
    console.log(`  • Modules: ${result.modules}`);
    console.log(`  • Lessons: ${result.lessons}`);
    console.log(`  • Question Banks: ${result.banks}`);
    console.log(`  • Questions: ${result.questions}`);
    console.log(`  • Exams: ${result.exams}`);
    console.log(`  • Flashcards: ${result.flashcards}`);
    console.log(`  • Errors: ${result.errors.length}`);
    console.log(`  • Version: ${result.version}`);
    console.log('');

    if (result.errors.length > 0) {
      console.log('Errors encountered:');
      result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log('\n✅ Content import complete! Visit the application to see the results.\n');

    return result;
  }

  /**
   * Helper to extract all regex matches as an array
   */
  private getAllMatches(content: string, pattern: RegExp): RegExpExecArray[] {
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      matches.push(match);
    }
    return matches;
  }

  /**
   * Enhanced flashcard generation with DFS-specific markers
   * Extracts: [ Define ], [ Identify ], [ Contrast ], [ Note ], iFlash4u
   */
  private async generateEnhancedFlashcards(nodes: ParsedNode[]): Promise<number> {
    const flashcards: Array<{
      type: 'term' | 'mcq';
      front: string;
      back: string;
      prompt?: string;
      options?: string[];
      answerIndex?: number;
      rationale?: string;
      sourceId?: string;
      tags: string[];
    }> = [];

    for (const node of nodes) {
      if (node.type !== 'content') continue;

      const content = node.content || node.text || '';
      // Access metadata with type assertion for extended properties
      const metadata = node.metadata as { documentId?: string; documentTitle?: string } | undefined;
      const docId = metadata?.documentId || 'unknown';

      // Pattern 1: [ Define ] markers
      const defineMatches = this.getAllMatches(content, /\[\s*Define\s*\]\s*([^[\]]+?)(?:\s*[-–:]\s*|\n)([^[\]]+?)(?=\[|$)/gi);
      for (const match of defineMatches) {
        const term = match[1]?.trim() || '';
        const definition = match[2]?.trim() || '';
        if (term.length > 3 && definition.length > 10) {
          flashcards.push({
            type: 'term',
            front: `Define: ${term}`,
            back: definition,
            sourceId: docId,
            tags: ['define', ...this.extractTags(term + ' ' + definition)]
          });
        }
      }

      // Pattern 2: [ Identify ] markers
      const identifyMatches = this.getAllMatches(content, /\[\s*Identify\s*\]\s*([^[\]]+?)(?:\s*[-–:]\s*|\n)([^[\]]+?)(?=\[|$)/gi);
      for (const match of identifyMatches) {
        const concept = match[1]?.trim() || '';
        const explanation = match[2]?.trim() || '';
        if (concept.length > 3 && explanation.length > 10) {
          flashcards.push({
            type: 'term',
            front: `Identify: ${concept}`,
            back: explanation,
            sourceId: docId,
            tags: ['identify', ...this.extractTags(concept + ' ' + explanation)]
          });
        }
      }

      // Pattern 3: [ Contrast ] markers
      const contrastMatches = this.getAllMatches(content, /\[\s*Contrast\s*\]\s*([^[\]]+?)(?:\s*[-–:]\s*|\n)([^[\]]+?)(?=\[|$)/gi);
      for (const match of contrastMatches) {
        const items = match[1]?.trim() || '';
        const comparison = match[2]?.trim() || '';
        if (items.length > 3 && comparison.length > 10) {
          flashcards.push({
            type: 'term',
            front: `Contrast: ${items}`,
            back: comparison,
            sourceId: docId,
            tags: ['contrast', ...this.extractTags(items + ' ' + comparison)]
          });
        }
      }

      // Pattern 4: iFlash4u sections (pre-made flashcards)
      const iflashMatches = this.getAllMatches(content, /iFlash4u[:\s]*([^?]+)\?\s*([^.!?\n]+[.!?]?)/gi);
      for (const match of iflashMatches) {
        const question = (match[1]?.trim() || '') + '?';
        const answer = match[2]?.trim() || '';
        if (question.length > 5 && answer.length > 5) {
          flashcards.push({
            type: 'term',
            front: question,
            back: answer,
            sourceId: docId,
            tags: ['iflash4u', ...this.extractTags(question + ' ' + answer)]
          });
        }
      }

      // Pattern 5: WHAT/WHO/WHEN question patterns
      const questionPatterns = [
        /WHAT\s+is\s+([^?]+)\?\s*([^.!?\n]+[.!?])/gi,
        /WHO\s+(?:is|are|issues?)\s+([^?]+)\?\s*([^.!?\n]+[.!?])/gi,
        /WHEN\s+(?:is|are|does?)\s+([^?]+)\?\s*([^.!?\n]+[.!?])/gi
      ];

      for (const pattern of questionPatterns) {
        const matches = this.getAllMatches(content, pattern);
        for (const match of matches) {
          const question = match[0].split('?')[0] + '?';
          const answer = match[2]?.trim() || match[0].split('?')[1]?.trim() || '';
          if (question.length > 10 && answer.length > 5) {
            flashcards.push({
              type: 'term',
              front: question,
              back: answer,
              sourceId: docId,
              tags: this.extractTags(question + ' ' + answer)
            });
          }
        }
      }
    }

    // Deduplicate flashcards by front text
    const uniqueFlashcards = Array.from(
      new Map(flashcards.map(fc => [fc.front.toLowerCase(), fc])).values()
    );

    console.log(`    Found ${flashcards.length} potential flashcards, ${uniqueFlashcards.length} unique`);

    // Save flashcards to database (no limit for full import)
    let savedCount = 0;
    for (const card of uniqueFlashcards) {
      try {
        await storage.createFlashcard({
          type: card.type,
          front: card.front,
          back: card.back,
          prompt: card.prompt,
          options: card.options,
          answerIndex: card.answerIndex,
          rationale: card.rationale,
          sourceId: card.sourceId,
          difficulty: 2.5,
          interval: 1,
          nextReview: new Date(),
          userId: 'system'
        });
        savedCount++;
      } catch (error) {
        // Ignore individual card errors
      }
    }

    return savedCount;
  }

  /**
   * Find all 5 DFS documents in attached_assets
   */
  async findAllDFSDocuments(): Promise<{ found: DFSDocument[]; missing: DFSDocument[] }> {
    const attachedDir = path.resolve(__dirname, '../../../attached_assets');
    const found: DFSDocument[] = [];
    const missing: DFSDocument[] = [];

    for (const doc of DFS_DOCUMENTS) {
      const docPath = path.join(attachedDir, doc.filename);
      try {
        await fs.access(docPath);
        found.push(doc);
      } catch {
        missing.push(doc);
      }
    }

    return { found, missing };
  }
}

// Export singleton instance
export const importService = new DFS215ImportService();