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
  temperature = 0.2,
  maxTokens = 768
): Promise<AgentResponse> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error(`Error calling OpenAI for ${agent}:`, error);
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
    front: string;
    back: string;
    sourceId?: string;
  }>;
  count: number;
}> {
  try {
    const systemPrompt = `You are an expert flashcard generator for insurance education. Create ${count} flashcards from the provided content in ${style} style. Focus on key terms, concepts, regulations, and practical applications. Return JSON with this format: {"cards": [{"id": "uuid", "type": "term|mcq|cloze", "front": "question/term", "back": "answer/definition", "sourceId": "optional"}], "count": number}`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5",
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
      max_tokens: 2000,
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
      max_tokens: 512,
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
