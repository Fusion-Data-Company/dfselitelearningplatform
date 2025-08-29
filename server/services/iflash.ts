import { storage } from "../storage";
import { generateFlashcards } from "./openai";
import type { Flashcard, InsertFlashcard } from "@shared/schema";

export interface SRSCalculation {
  interval: number;
  difficulty: number;
  nextReview: Date;
}

export class IFlashService {
  // SM-2 Spaced Repetition Algorithm
  calculateSRS(currentDifficulty: number, grade: number, currentInterval: number): SRSCalculation {
    // Grade: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
    let newDifficulty = currentDifficulty;
    let newInterval = currentInterval;

    if (grade < 2) {
      // Incorrect response - reset interval to 1 day
      newInterval = 1;
      newDifficulty = Math.max(1.3, currentDifficulty - 0.2);
    } else {
      // Correct response
      if (currentInterval === 1) {
        newInterval = 6; // First correct review -> 6 days
      } else {
        newInterval = Math.round(currentInterval * newDifficulty);
      }

      // Adjust difficulty based on grade
      newDifficulty = newDifficulty + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02));
      newDifficulty = Math.max(1.3, newDifficulty);
    }

    // Apply grade-specific multipliers
    switch (grade) {
      case 0: // Again
        newInterval = Math.round(newInterval * 0.2); // Much shorter
        break;
      case 1: // Hard
        newInterval = Math.round(newInterval * 1.2); // Slightly longer
        break;
      case 2: // Good
        // Use calculated interval
        break;
      case 3: // Easy
        newInterval = Math.round(newInterval * 1.3); // Longer interval
        newDifficulty += 0.15; // Increase difficulty faster
        break;
    }

    // Ensure minimum interval of 1 day
    newInterval = Math.max(1, newInterval);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      interval: newInterval,
      difficulty: newDifficulty,
      nextReview
    };
  }

  // MCQ Normalizer: Convert legacy text blob MCQs to structured format
  normalizeMCQ(card: Flashcard): Partial<Flashcard> {
    if (card.type !== 'mcq' || card.options || !card.front) {
      return card; // Already structured or not an MCQ
    }

    try {
      // Parse legacy MCQ format - support both inline and line-by-line formats
      const text = card.front || '';
      
      // Try line-by-line format first: "Question:\nA) Option A\nB) Option B..."
      const lineByLineRegex = /^(.*?)(?:\n|^)\s*([ABCD])\)\s*([^\n]*?)(?:\n\s*([ABCD])\)\s*([^\n]*?))*$/gm;
      const multilineMatches = text.match(/^(.*?)(?:\r?\n|\r)\s*[ABCD]\)/m);
      
      if (multilineMatches) {
        // Line-by-line format
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        const prompt = lines[0].replace(/:?\s*$/, ':'); // Ensure ends with colon
        
        const options: string[] = [];
        const optionRegex = /^([ABCD])\)\s*(.+)$/;
        
        for (let i = 1; i < lines.length; i++) {
          const match = lines[i].match(optionRegex);
          if (match) {
            options.push(match[2].trim());
          }
        }
        
        if (options.length >= 2) {
          // Try to find answer in back text
          let answerIndex: number | null = null;
          if (card.back) {
            const answerMatch = card.back.match(/(?:answer|correct)[\s:]*([ABCD])/i) || 
                               card.back.match(/\b([ABCD])\)/);
            if (answerMatch) {
              const letter = answerMatch[1].toUpperCase();
              answerIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
            }
          }
          
          return {
            ...card,
            prompt,
            options,
            answerIndex,
            rationale: card.back || null
          };
        }
      }
      
      // Fallback to inline format: "Question stem A) Option A B) Option B..."
      const optionRegex = /\s*([ABCD])\)\s*([^A-D]*?)(?=\s*[ABCD]\)|$)/gi;
      const matches = Array.from(text.matchAll(optionRegex));
      
      if (matches.length < 2) {
        // Not a parseable MCQ, keep as-is
        return card;
      }

      // Extract question stem (everything before first option)
      const firstMatch = matches[0];
      const prompt = text.substring(0, firstMatch.index || 0).trim().replace(/:?\s*$/, ':');
      
      // Extract options
      const options = matches.map(match => match[2].trim());
      
      // Try to find answer in back text
      let answerIndex: number | null = null;
      if (card.back) {
        const answerMatch = card.back.match(/(?:answer|correct)[\s:]*([ABCD])/i) || 
                           card.back.match(/\b([ABCD])\)/);
        if (answerMatch) {
          const letter = answerMatch[1].toUpperCase();
          answerIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
        }
      }

      return {
        ...card,
        prompt,
        options,
        answerIndex,
        rationale: card.back || null
      };
    } catch (error) {
      console.error('Error normalizing MCQ:', error);
      return card;
    }
  }

  async generateFlashcardsFromContent(
    userId: string,
    sourceIds: string[],
    style: 'concise' | 'exam' | 'mnemonic' = 'exam',
    maxCards = 60
  ): Promise<{
    created: number;
    duplicates: number;
    cards: Flashcard[];
  }> {
    // Get source content
    const chunks = await Promise.all(
      sourceIds.map(id => storage.getContentChunk(id))
    );
    
    const sourceText = chunks
      .filter(Boolean)
      .map(chunk => chunk!.text)
      .join('\n\n');

    if (!sourceText) {
      throw new Error('No content found for the provided source IDs');
    }

    // Generate flashcards using AI
    const generated = await generateFlashcards(sourceText, style, maxCards);
    
    // Get existing cards to check for duplicates
    const existingCards = await storage.getUserFlashcards(userId);
    const existingHashes = new Set(
      existingCards.map(card => this.hashCard(userId, card.type, card.front || '', card.sourceId ?? undefined))
    );

    const newCards: InsertFlashcard[] = [];
    let duplicateCount = 0;

    for (const cardData of generated.cards) {
      const hash = this.hashCard(userId, cardData.type, cardData.front || '', cardData.sourceId);
      
      if (existingHashes.has(hash)) {
        duplicateCount++;
        continue;
      }

      const card: InsertFlashcard = {
        userId,
        type: cardData.type,
        front: cardData.front || '',
        back: cardData.back || '',
        prompt: cardData.prompt || null,
        options: cardData.options || null,
        answerIndex: cardData.answerIndex ?? null,
        rationale: cardData.rationale || null,
        sourceId: cardData.sourceId || sourceIds[0], // Use first source as fallback
        difficulty: 2.5, // Default SM-2 ease factor
        interval: 1,
        nextReview: new Date(),
        reviewCount: 0
      };

      newCards.push(card);
      existingHashes.add(hash);
    }

    // Create cards in database
    const createdCards: Flashcard[] = [];
    for (const card of newCards) {
      try {
        const created = await storage.createFlashcard(card);
        createdCards.push(created);
      } catch (error) {
        console.error('Error creating flashcard:', error);
      }
    }

    return {
      created: createdCards.length,
      duplicates: duplicateCount,
      cards: createdCards
    };
  }

  async reviewFlashcard(
    userId: string,
    cardId: string,
    grade: number // 0-3: Again, Hard, Good, Easy
  ): Promise<Flashcard> {
    const card = await storage.getFlashcard(cardId);
    if (!card || card.userId !== userId) {
      throw new Error('Flashcard not found or access denied');
    }

    // Calculate new SRS values
    const srs = this.calculateSRS(card.difficulty ?? 2.5, grade, card.interval ?? 1);
    
    // Update the card
    const updatedCard = await storage.updateFlashcard(cardId, {
      difficulty: srs.difficulty,
      interval: srs.interval,
      lastReviewed: new Date(),
      nextReview: srs.nextReview,
      reviewCount: (card.reviewCount ?? 0) + 1
    });

    // Log the review
    await storage.createFlashcardReview({
      userId,
      cardId,
      grade,
      reviewedAt: new Date()
    });

    return updatedCard;
  }

  async getFlashcardsForReview(userId: string, limit = 50): Promise<Flashcard[]> {
    return await storage.getFlashcardsForReview(userId);
  }

  async getStudyStats(userId: string): Promise<{
    totalCards: number;
    dueToday: number;
    reviewStreak: number;
    accuracy: number;
    timeToday: number;
  }> {
    const [allCards, dueCards] = await Promise.all([
      storage.getUserFlashcards(userId),
      storage.getFlashcardsForReview(userId)
    ]);

    // Calculate accuracy from recent reviews
    // This is a simplified calculation - in production you'd want more sophisticated metrics
    const accuracy = allCards.length > 0 ? 
      allCards.filter(card => (card.reviewCount ?? 0) > 0).length / allCards.length : 0;

    return {
      totalCards: allCards.length,
      dueToday: dueCards.length,
      reviewStreak: 12, // Placeholder - would calculate from review history
      accuracy: Math.round(accuracy * 100),
      timeToday: 0 // Placeholder - would track from session data
    };
  }

  // Backfill existing MCQ cards with normalized structure
  async backfillMCQCards(batchSize = 100): Promise<{
    scanned: number;
    converted: number;
    ambiguous: number;
  }> {
    let scanned = 0;
    let converted = 0;
    let ambiguous = 0;
    let offset = 0;

    try {
      while (true) {
        // Get batch of MCQ cards without structured options
        // For now, skip the backfill functionality since we don't have the batch method implemented
        // This would require implementing the getFlashcardsBatch method in storage
        // Backfill would process existing cards in batches here
        // Currently disabled until getFlashcardsBatch is implemented in storage
        console.log('Backfill operation not yet implemented - missing getFlashcardsBatch method');
        break;
      }
    } catch (error) {
      console.error('Backfill operation failed:', error);
      throw error;
    }

    return { scanned, converted, ambiguous };
  }

  private hashCard(userId: string, type: string, front: string, sourceId?: string): string {
    // Create a hash for duplicate detection
    const key = `${userId}|${type}|${front}|${sourceId || ''}`;
    // Simple hash function - in production use crypto.createHash
    return Buffer.from(key).toString('base64');
  }
}

export const iflashService = new IFlashService();
