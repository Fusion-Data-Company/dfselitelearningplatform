import mammoth from 'mammoth';
import TurndownService from 'turndown';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParsedNode {
  level: number;
  text: string;
  html?: string;
  type: 'heading' | 'content' | 'question' | 'answer';
  page?: number;
}

export class DocxParser {
  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // Preserve important elements
    this.turndown.addRule('preserveCallouts', {
      filter: function(node, options) {
        return node.nodeName === 'P' && 
               !!(node.textContent?.includes('[') || 
                node.textContent?.includes('Define') ||
                node.textContent?.includes('Identify') ||
                node.textContent?.includes('Note') ||
                node.textContent?.includes('Example'));
      },
      replacement: function(content, node) {
        return '\n' + content + '\n';
      }
    });
  }

  async parseDocx(filePath: string): Promise<ParsedNode[]> {
    try {
      // Check if file exists
      const fullPath = path.resolve(filePath);
      await fs.access(fullPath);
      
      const buffer = await fs.readFile(fullPath);
      const result = await mammoth.convertToHtml({ buffer });
      
      if (result.messages.length > 0) {
        console.log('Conversion messages:', result.messages);
      }
      
      // Convert HTML to structured nodes
      const nodes = this.parseHtmlToNodes(result.value);
      
      // Normalize heading levels
      return this.normalizeHeadings(nodes);
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseHtmlToNodes(html: string): ParsedNode[] {
    const nodes: ParsedNode[] = [];
    
    // Split HTML into lines for processing
    const lines = html.split(/\n+/);
    let currentPage = 1;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Detect headings
      const headingMatch = trimmed.match(/<h(\d)>(.*?)<\/h\d>/i);
      if (headingMatch) {
        const level = parseInt(headingMatch[1]);
        const text = this.cleanText(headingMatch[2]);
        nodes.push({
          level,
          text,
          type: 'heading',
          page: currentPage
        });
        continue;
      }
      
      // Detect questions
      if (this.isQuestion(trimmed)) {
        nodes.push({
          level: 0,
          text: this.cleanText(trimmed),
          type: 'question',
          html: trimmed,
          page: currentPage
        });
        continue;
      }
      
      // Detect answers
      if (this.isAnswer(trimmed)) {
        nodes.push({
          level: 0,
          text: this.cleanText(trimmed),
          type: 'answer',
          html: trimmed,
          page: currentPage
        });
        continue;
      }
      
      // Regular content
      const cleanText = this.cleanText(trimmed);
      if (cleanText) {
        nodes.push({
          level: 0,
          text: cleanText,
          type: 'content',
          html: trimmed,
          page: currentPage
        });
      }
      
      // Track page breaks
      if (trimmed.includes('Page') && trimmed.match(/Page\s+\d+/)) {
        const pageMatch = trimmed.match(/Page\s+(\d+)/);
        if (pageMatch) {
          currentPage = parseInt(pageMatch[1]);
        }
      }
    }
    
    return nodes;
  }

  private normalizeHeadings(nodes: ParsedNode[]): ParsedNode[] {
    // Find major sections and normalize levels
    const normalized: ParsedNode[] = [];
    
    for (const node of nodes) {
      if (node.type === 'heading') {
        // Detect major tracks (H1)
        if (this.isMajorTrack(node.text)) {
          normalized.push({ ...node, level: 1 });
        }
        // Detect modules (H2)
        else if (this.isModule(node.text, node.level)) {
          normalized.push({ ...node, level: 2 });
        }
        // Detect lessons (H3)
        else if (this.isLesson(node.text, node.level)) {
          normalized.push({ ...node, level: 3 });
        }
        // Subsections (H4/H5)
        else {
          normalized.push({ ...node, level: Math.min(node.level, 5) });
        }
      } else {
        normalized.push(node);
      }
    }
    
    return normalized;
  }

  private isMajorTrack(text: string): boolean {
    const trackKeywords = [
      'Law & Ethics',
      'Health Insurance',
      'Managed Care',
      'Social Insurance',
      'OASDI',
      'Disability',
      'Life Insurance',
      'Annuities',
      'FIGA',
      'DFS',
      'CFO',
      'Buyer'
    ];
    
    return trackKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private isModule(text: string, level: number): boolean {
    // Module-level indicators
    return level === 2 || (
      level <= 3 && (
        !!text.match(/^\d+\.\d+/) ||
        text.includes('Overview') ||
        text.includes('Introduction') ||
        text.includes('Section')
      )
    );
  }

  private isLesson(text: string, level: number): boolean {
    // Lesson-level indicators
    return level === 3 || (
      level <= 4 && (
        !!text.match(/^\d+\.\d+\.\d+/) ||
        text.includes('Lesson') ||
        text.includes('Topic')
      )
    );
  }

  private isQuestion(text: string): boolean {
    // Question patterns
    return !!(
      text.match(/^\s*\d+[\.\)]\s+\w+/) ||
      text.match(/^Q\d+:/) ||
      text.includes('Which of the following') ||
      text.includes('What is') ||
      text.includes('How do') ||
      text.includes('True or False')
    );
  }

  private isAnswer(text: string): boolean {
    // Answer patterns
    return !!(
      text.match(/^\s*[A-D][\)\.\:]\s+/) ||
      text.match(/^Answer\s*[:\-]/i) ||
      text.match(/^Correct\s*[:\-]/i)
    );
  }

  private cleanText(html: string): string {
    // Remove HTML tags and clean text
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  detectAssessments(nodes: ParsedNode[]): ParsedNode[] {
    // Find quiz and exam sections
    return nodes.filter(node => 
      node.type === 'heading' && (
        node.text.toLowerCase().includes('quiz') ||
        node.text.toLowerCase().includes('exam') ||
        node.text.toLowerCase().includes('review questions') ||
        node.text.toLowerCase().includes('self-test') ||
        node.text.toLowerCase().includes('practice')
      )
    );
  }
}