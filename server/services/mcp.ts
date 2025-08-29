import { storage } from "../storage";
import type { ContentChunk } from "@shared/schema";

export interface MCPContext {
  route: string;
  userId: string;
  lessonId?: string;
  chunkIds?: string[];
  selection?: {
    text?: string;
    ids?: string[];
  };
  attempt?: {
    id?: string;
    phase?: string;
  };
}

export interface MCPPassage {
  id: string;
  lessonId: string;
  text: string;
  headings: string[];
  refs: string[];
}

export interface MCPRetrievalResult {
  passages: MCPPassage[];
  used: {
    query?: string;
    ids?: string[];
  };
}

export interface MCPFlashcardResult {
  cards: Array<{
    id: string;
    type: 'term' | 'mcq' | 'cloze';
    front: string;
    back: string;
    sourceId?: string;
  }>;
  count: number;
}

export class MCPServer {
  async getContext(viewId: string): Promise<MCPContext> {
    // Parse viewId to extract context information
    // Format: route:userId:lessonId?:additional_params
    const parts = viewId.split(':');
    const route = parts[0] || '';
    const userId = parts[1] || '';
    const lessonId = parts[2] || undefined;

    // Get current user progress and lesson state
    let context: MCPContext = {
      route,
      userId,
      lessonId
    };

    if (lessonId) {
      // Get content chunks for this lesson
      const chunks = await storage.getContentChunksByLesson(lessonId);
      context.chunkIds = chunks.map(chunk => chunk.id);
    }

    return context;
  }

  async retrieveContent(params: {
    query?: string;
    ids?: string[];
    k?: number;
  }): Promise<MCPRetrievalResult> {
    const { query, ids, k = 3 } = params;
    let chunks: ContentChunk[] = [];

    if (ids && ids.length > 0) {
      // Retrieve specific chunks by IDs
      chunks = await Promise.all(
        ids.map(async (id) => {
          const chunk = await storage.getContentChunk(id);
          return chunk;
        })
      ).then(results => results.filter(Boolean) as ContentChunk[]);
    } else if (query) {
      // Search chunks by query
      chunks = await storage.searchContentChunks(query, k);
    }

    const passages: MCPPassage[] = chunks.map(chunk => ({
      id: chunk.id,
      lessonId: chunk.lessonId || '',
      text: chunk.text,
      headings: chunk.heading ? [chunk.heading] : [],
      refs: [`lesson:${chunk.lessonId || 'unknown'}`]
    }));

    return {
      passages,
      used: { query, ids }
    };
  }

  async iflashGenerate(params: {
    sourceIds?: string[];
    text?: string;
    style?: 'concise' | 'exam' | 'mnemonic';
  }): Promise<MCPFlashcardResult> {
    const { sourceIds, text, style = 'exam' } = params;
    
    // Get source text from chunks or use provided text
    let sourceText = text || '';
    
    if (sourceIds && sourceIds.length > 0) {
      const chunks = await Promise.all(
        sourceIds.map(id => storage.getContentChunk(id))
      );
      sourceText = chunks
        .filter(Boolean)
        .map(chunk => chunk!.text)
        .join('\n\n');
    }

    if (!sourceText) {
      throw new Error('No source text provided for flashcard generation');
    }

    // Import the function here to avoid circular dependencies
    const { generateFlashcards } = await import('./openai');
    
    const result = await generateFlashcards(sourceText, style);
    
    return result;
  }

  async logEvent(params: {
    userId: string;
    agent: string;
    tool: string;
    payload: any;
    traceId?: string;
  }): Promise<{ ok: boolean }> {
    try {
      await storage.createAgentLog({
        userId: params.userId,
        agent: params.agent,
        tool: params.tool,
        payload: this.redactPII(params.payload),
        traceId: params.traceId || `trace_${Date.now()}`
      });
      
      return { ok: true };
    } catch (error) {
      console.error('Error logging event:', error);
      throw new Error('Failed to log event');
    }
  }

  private redactPII(payload: any): any {
    // Remove or hash sensitive information
    const redacted = { ...payload };
    
    // Remove email addresses
    if (redacted.email) {
      redacted.email = '[REDACTED]';
    }
    
    // Remove phone numbers
    if (redacted.phone) {
      redacted.phone = '[REDACTED]';
    }
    
    // Hash user identifiers if needed
    if (redacted.personalInfo) {
      redacted.personalInfo = '[REDACTED]';
    }
    
    return redacted;
  }
}

export const mcpServer = new MCPServer();
