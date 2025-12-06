import { OpenAI } from "openai";

export interface VoiceQARequest {
  question: string;
  context: string;
  userId: string;
}

export interface VoiceQAResponse {
  answer: string;
  audioUrl?: string;
  citations?: string[];
}

export class VoiceQAService {
  private elevenLabsApiKey: string;
  private perplexityApiKey: string | null = null;

  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || null;
  }

  async processQuestionAndAnswer(request: VoiceQARequest): Promise<VoiceQAResponse> {
    try {
      // Use Perplexity for intelligent answers if available, otherwise use OpenAI
      let answer: string;
      let citations: string[] = [];

      if (this.perplexityApiKey) {
        const perplexityResponse = await this.queryPerplexity(request.question, request.context);
        answer = perplexityResponse.answer;
        citations = perplexityResponse.citations;
      } else {
        // Fallback to OpenAI for basic Q&A
        answer = await this.queryOpenAI(request.question, request.context);
      }

      // Generate audio using ElevenLabs
      const audioUrl = await this.generateAudio(answer);

      return {
        answer,
        audioUrl,
        citations
      };
    } catch (error) {
      console.error('Voice Q&A error:', error);
      throw new Error('Failed to process voice Q&A request');
    }
  }

  private async queryPerplexity(question: string, context: string): Promise<{ answer: string; citations: string[] }> {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API key not available');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance education tutor. Provide clear, accurate answers about insurance concepts, focusing on Florida DFS-215 certification material. Be concise but thorough.'
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nQuestion: ${question}\n\nPlease provide a clear, educational answer about this insurance concept.`
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      answer: data.choices[0].message.content,
      citations: data.citations || []
    };
  }

  private async queryOpenAI(question: string, context: string): Promise<string> {
    const openai = new OpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert insurance education tutor for Florida DFS-215 certification. Provide clear, accurate answers about insurance concepts.'
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nQuestion: ${question}\n\nProvide a clear, educational answer about this insurance concept.`
        }
      ],
      max_tokens: 500,
      temperature: 0.2
    });

    return response.choices[0].message?.content || 'Sorry, I could not generate an answer.';
  }

  private async generateAudio(text: string): Promise<string> {
    if (!this.elevenLabsApiKey) {
      console.warn('ElevenLabs API key not available, skipping audio generation');
      return '';
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.elevenLabsApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        console.warn(`ElevenLabs API error: ${response.statusText}`);
        return '';
      }

      const audioBlob = await response.blob();
      // In production, you'd save this to cloud storage and return URL
      // For now, convert to base64 for immediate playback
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      return `data:audio/mp3;base64,${base64Audio}`;
      
    } catch (error) {
      console.error('Audio generation error:', error);
      return '';
    }
  }
}

export const voiceQAService = new VoiceQAService();