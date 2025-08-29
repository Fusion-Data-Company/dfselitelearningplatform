import mammoth from 'mammoth';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParsedNode {
  type: 'heading' | 'content' | 'assessment';
  level: number;
  text: string;
  content: string;
  metadata?: {
    section?: string;
    isAssessment?: boolean;
    questionType?: string;
    page?: number;
  };
}

export class DOCXParser {
  private turndown: TurndownService;
  
  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-'
    });
    
    // Preserve important formatting
    this.turndown.keep(['strong', 'em', 'b', 'i', 'u', 'mark']);
    
    // Better table handling
    this.turndown.addRule('tables', {
      filter: 'table',
      replacement: (content, node, options) => {
        return '\n\n' + content + '\n\n';
      }
    });
    
    // Better list handling
    this.turndown.addRule('lists', {
      filter: ['ul', 'ol'],
      replacement: (content, node, options) => {
        return '\n' + content + '\n';
      }
    });
  }
  
  async parseToNodes(docxPath: string): Promise<ParsedNode[]> {
    const buffer = await fs.readFile(docxPath);
    
    // Comprehensive style mapping for DFS-215 document
    const result = await mammoth.convertToHtml({ buffer }, {
      styleMap: [
        // Standard headings
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading 2'] => h2", 
        "p[style-name='Heading 3'] => h3",
        "p[style-name='Heading 4'] => h4",
        "p[style-name='Heading 5'] => h5",
        "p[style-name='Title'] => h1",
        "p[style-name='Subtitle'] => h2",
        // JLP specific styles
        "p[style-name='JLP 1 - Section/Unit'] => h1",
        "p[style-name='JLP (Level 2)'] => h2",
        "p[style-name='JLP 3 - Supporting'] => h3",
        "p[style-name='JLP (Level 4)'] => h4",
        // TOC styles
        "p[style-name='TOC Heading'] => h1",
        "p[style-name='toc 1'] => h2",
        "p[style-name='toc 2'] => h3",
        "p[style-name='toc 3'] => h4",
        // Lists
        "p[style-name='List Paragraph'] => p.list-item",
        // Keep paragraphs
        "p => p"
      ]
    });
    
    if (result.messages && result.messages.length > 0) {
      console.log('Conversion messages:', result.messages.slice(0, 25));
    }
    
    // Parse HTML with cheerio for better extraction
    const $ = cheerio.load(result.value);
    const nodes: ParsedNode[] = [];
    let currentSection = '';
    let contentAccumulator: string[] = [];
    let currentHeadingLevel = 0;
    
    // Process all elements maintaining order
    const elements = $('body').children().toArray();
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const $el = $(element);
      const tagName = element.name.toLowerCase();
      const text = $el.text().trim();
      
      // Skip empty elements
      if (!text || text.length < 2) continue;
      
      // Check for page markers
      const pageMatch = text.match(/Page\s+(\d+)/i);
      if (pageMatch) {
        // Page marker, skip
        continue;
      }
      
      // Handle headings
      if (tagName.match(/^h[1-6]$/)) {
        // Save accumulated content before new heading
        if (contentAccumulator.length > 0) {
          const combinedContent = contentAccumulator.join('\n\n');
          if (combinedContent.length > 20) {
            nodes.push({
              type: 'content',
              level: currentHeadingLevel,
              text: combinedContent.substring(0, 200) + (combinedContent.length > 200 ? '...' : ''),
              content: combinedContent,
              metadata: {
                section: currentSection,
                isAssessment: this.detectAssessmentContent(combinedContent)
              }
            });
          }
          contentAccumulator = [];
        }
        
        // Extract heading level
        const level = parseInt(tagName[1]);
        currentHeadingLevel = level;
        
        // Detect major sections
        if (this.isMajorSection(text)) {
          currentSection = text;
          nodes.push({
            type: 'heading',
            level: 1,
            text,
            content: text
          });
        } else {
          nodes.push({
            type: 'heading',
            level: this.normalizeHeadingLevel(text, level),
            text,
            content: text,
            metadata: { section: currentSection }
          });
        }
      } 
      // Handle paragraphs
      else if (tagName === 'p') {
        const html = $.html($el);
        const markdown = this.turndown.turndown(html);
        
        // Check if this is a question or answer choice
        if (this.isQuestionStart(text)) {
          // Start of a question - collect it with its choices
          const questionData = this.extractQuestionFromElements($, elements, i);
          if (questionData) {
            nodes.push({
              type: 'assessment',
              level: 0,
              text: questionData.stem.substring(0, 100) + '...',
              content: JSON.stringify(questionData),
              metadata: {
                section: currentSection,
                isAssessment: true,
                questionType: questionData.type
              }
            });
            // Skip the elements we just processed
            i += questionData.elementsConsumed || 0;
          }
        } else if (markdown && markdown.length > 5) {
          // Regular content paragraph
          contentAccumulator.push(markdown);
        }
      }
      // Handle lists
      else if (tagName === 'ul' || tagName === 'ol') {
        const listItems: string[] = [];
        $el.find('li').each((idx, li) => {
          const itemText = $(li).text().trim();
          if (itemText) {
            listItems.push(`${tagName === 'ol' ? (idx + 1) + '.' : '-'} ${itemText}`);
          }
        });
        if (listItems.length > 0) {
          contentAccumulator.push(listItems.join('\n'));
        }
      }
      // Handle tables
      else if (tagName === 'table') {
        const tableData = this.extractTableData($, $el);
        if (tableData) {
          contentAccumulator.push(tableData);
        }
      }
    }
    
    // Save any remaining content
    if (contentAccumulator.length > 0) {
      const combinedContent = contentAccumulator.join('\n\n');
      if (combinedContent.length > 20) {
        nodes.push({
          type: 'content',
          level: currentHeadingLevel,
          text: combinedContent.substring(0, 200) + (combinedContent.length > 200 ? '...' : ''),
          content: combinedContent,
          metadata: {
            section: currentSection,
            isAssessment: this.detectAssessmentContent(combinedContent)
          }
        });
      }
    }
    
    // Log extraction stats
    console.log(`\n📊 DOCX Extraction Complete:`);
    console.log(`  Total nodes: ${nodes.length}`);
    console.log(`  Headings: ${nodes.filter(n => n.type === 'heading').length}`);
    console.log(`  Content blocks: ${nodes.filter(n => n.type === 'content').length}`);
    console.log(`  Assessment items: ${nodes.filter(n => n.type === 'assessment').length}`);
    
    const totalChars = nodes.reduce((sum, n) => sum + n.content.length, 0);
    console.log(`  Total content: ${Math.round(totalChars / 1000)}k characters`);
    
    return nodes;
  }
  
  private isMajorSection(text: string): boolean {
    const majorSections = [
      /^(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)/,
      /Law\s*(&|and)?\s*Ethics/i,
      /Health\s+Insurance/i,
      /Managed\s+Care/i,
      /Disability\s+Income/i,
      /Social\s+Insurance/i,
      /Life\s+Insurance/i,
      /Annuities/i,
      /Variable\s+Contracts/i,
      /FIGA/i,
      /DFS\s+Division/i,
      /CFO\s+Buyer/i,
      /Medicare/i,
      /OASDI/i,
      /iPower\s+Moves/i
    ];
    
    return majorSections.some(pattern => pattern.test(text));
  }
  
  private normalizeHeadingLevel(text: string, originalLevel: number): number {
    // Detect module-level headings
    if (/^\d+\.\d+/.test(text) || text.includes('Module') || text.includes('Section')) {
      return 2;
    }
    // Detect lesson-level headings
    if (/^\d+\.\d+\.\d+/.test(text) || 
        text.includes('Lesson') || 
        text.includes('Topic') ||
        text.startsWith('[') ||
        text.includes('Identify') ||
        text.includes('Define') ||
        text.includes('Contrast')) {
      return 3;
    }
    // Default to original level, capped at 5
    return Math.min(originalLevel, 5);
  }
  
  private detectAssessmentContent(text: string): boolean {
    const assessmentPatterns = [
      /Quiz\s*\d*:/i,
      /Review\s+Questions/i,
      /Practice\s+Questions/i,
      /Self[\s-]Test/i,
      /Assessment/i,
      /Exam\s+Questions/i,
      /^\d+\.\s+Which\s+of\s+the\s+following/im,
      /^\d+\.\s+What\s+is/im,
      /^\d+\.\s+True\s+or\s+False/im,
      /^[A-D]\)\s+/m,
      /Answer:\s*[A-D]/i,
      /Correct\s+answer/i,
      /The\s+correct\s+answer\s+is/i
    ];
    
    return assessmentPatterns.some(pattern => pattern.test(text));
  }
  
  private isQuestionStart(text: string): boolean {
    // Check if this looks like the start of a question
    return !!(
      text.match(/^\d+\.\s+\w+/) ||
      text.match(/^Q\d+[:\.]\s*/i) ||
      text.match(/^Question\s+\d+/i) ||
      text.includes('Which of the following') ||
      text.includes('What is the') ||
      text.includes('True or False') ||
      text.includes('All of the following EXCEPT')
    );
  }
  
  private extractQuestionFromElements($: cheerio.CheerioAPI, elements: any[], startIdx: number): any {
    const firstEl = $(elements[startIdx]);
    const stem = firstEl.text().trim();
    
    // Extract question number if present
    const numMatch = stem.match(/^(\d+)\.\s+(.+)/);
    const questionNum = numMatch ? numMatch[1] : null;
    const questionText = numMatch ? numMatch[2] : stem;
    
    // Look for answer choices in subsequent elements
    const choices: string[] = [];
    let answerKey: string[] = [];
    let elementsConsumed = 0;
    
    for (let i = startIdx + 1; i < elements.length && i < startIdx + 10; i++) {
      const el = $(elements[i]);
      const text = el.text().trim();
      
      // Check for answer choice pattern
      const choiceMatch = text.match(/^([A-D])[\.)\]]\s*(.+)/);
      if (choiceMatch) {
        choices.push(choiceMatch[2]);
        elementsConsumed++;
      }
      // Check for answer key
      else if (text.match(/^Answer:\s*([A-D])/i)) {
        const answerMatch = text.match(/^Answer:\s*([A-D])/i);
        if (answerMatch) {
          answerKey = [answerMatch[1]];
        }
        elementsConsumed++;
        break; // Found answer, stop looking
      }
      // If we hit another question or heading, stop
      else if (this.isQuestionStart(text) || $(elements[i]).prop('tagName')?.match(/^H[1-6]$/i)) {
        break;
      }
    }
    
    // Only return if we found choices
    if (choices.length >= 2) {
      return {
        type: choices.length === 2 && choices.every(c => c.match(/^(True|False)/i)) ? 'tf' : 'mcq',
        stem: questionText,
        choices,
        answerKey,
        elementsConsumed,
        questionNumber: questionNum
      };
    }
    
    return null;
  }
  
  private extractTableData($: cheerio.CheerioAPI, $table: cheerio.Cheerio<any>): string {
    const rows: string[] = [];
    
    // Extract headers
    const headers: string[] = [];
    $table.find('thead th, tr:first-child th, tr:first-child td').each((_: number, cell: any) => {
      headers.push($(cell).text().trim());
    });
    
    if (headers.length > 0) {
      rows.push('| ' + headers.join(' | ') + ' |');
      rows.push('|' + headers.map(() => '---').join('|') + '|');
    }
    
    // Extract data rows
    $table.find('tbody tr, tr').each((idx: number, tr: any) => {
      // Skip header row if we already processed it
      if (idx === 0 && headers.length > 0) return;
      
      const cells = $(tr).find('td, th').map((_: number, cell: any) => 
        $(cell).text().trim()
      ).get();
      
      if (cells.length > 0) {
        rows.push('| ' + cells.join(' | ') + ' |');
      }
    });
    
    return rows.join('\n');
  }
}

// Export for backwards compatibility
export { DOCXParser as DocxParser };