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
      existingCards.map(card => this.hashCard(userId, card.type, card.front, card.sourceId ?? undefined))
    );

    const newCards: InsertFlashcard[] = [];
    let duplicateCount = 0;

    for (const cardData of generated.cards) {
      const hash = this.hashCard(userId, cardData.type, cardData.front, cardData.sourceId);
      
      if (existingHashes.has(hash)) {
        duplicateCount++;
        continue;
      }

      const card: InsertFlashcard = {
        userId,
        type: cardData.type,
        front: cardData.front,
        back: cardData.back,
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

  private hashCard(userId: string, type: string, front: string, sourceId?: string): string {
    // Create a hash for duplicate detection
    const key = `${userId}|${type}|${front}|${sourceId || ''}`;
    // Simple hash function - in production use crypto.createHash
    return Buffer.from(key).toString('base64');
  }
}

export const iflashService = new IFlashService();
