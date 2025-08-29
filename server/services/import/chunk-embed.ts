import { storage } from "../../storage";
import { OpenAI } from "openai";
import type { Lesson } from "@shared/schema";

export interface ContentChunk {
  lessonId: string;
  text: string;
  tokens: number;
  embedding?: number[];
  headings: string[];
  pageRef?: number;
}

export class ChunkEmbedder {
  private openai: OpenAI | null = null;
  private readonly chunkSize = 600;
  private readonly overlapSize = 80;
  
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }
  
  async chunkAndEmbedLesson(lesson: Lesson): Promise<ContentChunk[]> {
    const chunks: ContentChunk[] = [];
    
    if (!lesson.content) return chunks;
    
    // Split content into chunks
    const textChunks = this.splitIntoChunks(lesson.content);
    
    // Create chunks with metadata
    for (const textChunk of textChunks) {
      const chunk: ContentChunk = {
        lessonId: lesson.id,
        text: textChunk,
        tokens: this.estimateTokens(textChunk),
        headings: this.extractHeadings(textChunk),
        pageRef: this.extractPageRef(textChunk)
      };
      
      // Generate embedding if OpenAI is available
      if (this.openai) {
        try {
          chunk.embedding = await this.generateEmbedding(textChunk);
        } catch (error) {
          console.warn(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    let currentTokens = 0;
    
    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);
      
      if (currentTokens + sentenceTokens > this.chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        
        // Create overlap with last few sentences
        const overlap = currentChunk.split(/(?<=[.!?])\s+/).slice(-2).join(' ');
        currentChunk = overlap + ' ' + sentence;
        currentTokens = this.estimateTokens(currentChunk);
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  private extractHeadings(text: string): string[] {
    const headings: string[] = [];
    const headingMatches = text.match(/^#+\s+(.+)$/gm);
    
    if (headingMatches) {
      for (const match of headingMatches) {
        const heading = match.replace(/^#+\s+/, '');
        headings.push(heading);
      }
    }
    
    return headings;
  }
  
  private extractPageRef(text: string): number | undefined {
    const pageMatch = text.match(/Page\s+(\d+)/i);
    return pageMatch ? parseInt(pageMatch[1]) : undefined;
  }
  
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) return [];
    
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }
  
  async saveChunks(chunks: ContentChunk[]): Promise<number> {
    let savedCount = 0;
    
    for (const chunk of chunks) {
      try {
        // Store chunk in database
        await storage.createContentChunk({
          lessonId: chunk.lessonId,
          content: chunk.text,
          tokens: chunk.tokens,
          headings: chunk.headings,
          pageRef: chunk.pageRef,
          embedding: chunk.embedding
        });
        savedCount++;
      } catch (error) {
        console.error('Error saving chunk:', error);
      }
    }
    
    console.log(`Saved ${savedCount} chunks`);
    return savedCount;
  }
  
  async retrieveContent(query: string, limit: number = 5): Promise<ContentChunk[]> {
    // For now, do simple keyword matching
    // In production, this would use vector similarity search
    const chunks = await storage.searchContentChunks(query, limit);
    
    return chunks.map(chunk => ({
      lessonId: chunk.lessonId,
      text: chunk.content,
      tokens: chunk.tokens,
      headings: chunk.headings || [],
      pageRef: chunk.pageRef
    }));
  }
}