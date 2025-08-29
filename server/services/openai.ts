import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export interface AgentResponse {
  role: string;
  message: string;
  steps?: string[];
  citations?: { chunkId: string; lesson: string; heading?: string }[];
  actions?: { type: string; [key: string]: any }[];
}

export async function callAgent(
  agent: string,
  systemPrompt: string,
  userMessage: string,
  context?: any,
  temperature = 1,
  maxTokens = 768
): Promise<AgentResponse> {
  const timeoutMs = agent === 'proctorbot' ? 2000 : agent === 'coachbot' ? 4000 : 5000;
  
  try {
    // Add JSON format instruction to system prompt if not present
    const jsonSystemPrompt = systemPrompt.includes('JSON') ? 
      systemPrompt : 
      systemPrompt + '\n\nIMPORTANT: Always respond in valid JSON format with this structure: {"role": "assistant", "message": "your response", "citations": [{"chunkId": "id", "lesson": "title"}], "steps": ["step1", "step2"]}';

    const response = await Promise.race([
      getOpenAI().chat.completions.create({
        model: "gpt-4o", // Using GPT-4o for compatibility
        messages: [
          {
            role: "system",
            content: jsonSystemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 1.0,
        response_format: { type: "json_object" }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]) as any;

    const choice = response.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
      console.error('OpenAI response details:', { 
        choices: response.choices, 
        choice: choice,
        content: content 
      });
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error(`Error calling OpenAI for ${agent}:`, error);
    
    // Fallback to GPT-4 mini on timeout or quota error
    if (error instanceof Error && (error.message.includes('Timeout') || error.message.includes('quota'))) {
      try {
        console.log(`Falling back to GPT-4 mini for ${agent}`);
        const fallbackResponse = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system", 
              content: systemPrompt + '\n\nRespond in JSON format: {"role": "assistant", "message": "your response"}'
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          max_tokens: Math.min(maxTokens, 512),
          temperature: temperature
        });
        
        const fallbackContent = fallbackResponse.choices[0].message.content;
        if (fallbackContent) {
          return JSON.parse(fallbackContent);
        }
      } catch (fallbackError) {
        console.error(`Fallback also failed for ${agent}:`, fallbackError);
      }
    }
    
    throw new Error(`Failed to get response from ${agent}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateFlashcards(
  sourceText: string,
  style: 'concise' | 'exam' | 'mnemonic' = 'exam',
  count = 20
): Promise<{
  cards: Array<{
    id: string;
    type: 'term' | 'mcq' | 'cloze';
    front?: string;
    back?: string;
    prompt?: string;
    options?: string[];
    answerIndex?: number;
    rationale?: string;
    sourceId?: string;
  }>;
  count: number;
}> {
  try {
    const systemPrompt = `You are an expert flashcard generator for insurance education. Create ${count} flashcards from the provided content in ${style} style. Focus on key terms, concepts, regulations, and practical applications. 

For MCQ cards, use this structure with line-by-line formatting:
{"type": "mcq", "prompt": "Question stem without choices:", "options": ["Option A text", "Option B text", "Option C text", "Option D text"], "answerIndex": 1, "rationale": "Brief explanation", "sourceId": "optional"}

IMPORTANT: Format MCQ prompts to end with a colon and ensure each option is a complete, clear statement that works well when displayed as:
A) [Option text]
B) [Option text] 
C) [Option text]
D) [Option text]

For term/cloze cards, use:
{"type": "term", "front": "question/term", "back": "answer/definition", "sourceId": "optional"}

Return JSON: {"cards": [...], "count": number}`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Generate flashcards from this content:\n\n${sourceText}`
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeQuizPerformance(
  responses: any[],
  questions: any[]
): Promise<{
  weakTopics: string[];
  recommendations: string[];
  nextSteps: string[];
}> {
  try {
    const systemPrompt = "You are an educational analytics expert. Analyze quiz performance and provide specific recommendations for improvement. Return JSON with weakTopics, recommendations, and nextSteps arrays.";

    const analysisData = {
      responses: responses.map(r => ({ questionId: r.questionId, correct: r.correct, topic: r.topic })),
      performance: responses.filter(r => r.correct).length / responses.length
    };

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this quiz performance data: ${JSON.stringify(analysisData)}`
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 512,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing quiz performance:", error);
    throw new Error(`Failed to analyze performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
