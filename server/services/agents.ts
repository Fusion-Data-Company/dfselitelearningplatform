import { storage } from "../storage";
import { mcpServer } from "./mcp";
import { callAgent, type AgentResponse } from "./openai";
import type { AgentProfile } from "../../shared/schema";

export class AgentService {
  private agentCache = new Map<string, AgentProfile>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute

  async getAgentProfile(agentId: string): Promise<AgentProfile | null> {
    const now = Date.now();
    const cached = this.agentCache.get(agentId);
    const expiry = this.cacheExpiry.get(agentId);

    if (cached && expiry && now < expiry) {
      return cached;
    }

    const profile = await storage.getAgentProfile(agentId);
    if (profile) {
      this.agentCache.set(agentId, profile);
      this.cacheExpiry.set(agentId, now + this.CACHE_TTL);
    }

    return profile || null;
  }

  async processAgentRequest(
    agentId: string,
    userMessage: string,
    viewId: string,
    userId: string
  ): Promise<AgentResponse> {
    const profile = await this.getAgentProfile(agentId);
    if (!profile) {
      throw new Error(`Agent profile not found: ${agentId}`);
    }

    console.log('processAgentRequest params:', { agentId, userMessage: userMessage?.substring(0, 30), viewId, userId });

    // Get context for the current view
    const context = await mcpServer.getContext(viewId);
    
    // Build enhanced system prompt with context
    const enhancedPrompt = this.buildSystemPrompt(profile.systemPrompt, context, agentId) + '\n\nPlease respond in JSON format with the structure: {"role": "assistant", "message": "your response here"}';
    
    // Log the agent interaction
    await mcpServer.logEvent({
      userId,
      agent: agentId,
      tool: 'chat',
      payload: {
        message: userMessage,
        viewId,
        context: context.route
      }
    });

    try {
      // Set agent-specific parameters per blueprint
      const agentParams = {
        coachbot: { temperature: 0.2, maxTokens: 768 },
        studybuddy: { temperature: 0.35, maxTokens: 700 },
        proctorbot: { temperature: 0.0, maxTokens: 320 }
      };
      
      const params = agentParams[agentId as keyof typeof agentParams] || { temperature: 0.2, maxTokens: 768 };
      
      const response = await callAgent(
        agentId,
        enhancedPrompt,
        userMessage,
        context,
        params.temperature,
        params.maxTokens
      );

      // Validate response based on guardrails and requirements
      this.validateAgentResponse(response, profile, context);
      
      // Enforce citations for teaching agents
      if ((agentId === 'coachbot' || agentId === 'studybuddy') && context.route !== 'exam') {
        if (!response.citations || response.citations.length === 0) {
          // Add citations from context if available
          response.citations = context.chunkIds ? 
            context.chunkIds.slice(0, 3).map((id: string) => ({ chunkId: id, lesson: context.lessonId || 'Unknown' })) :
            [{ chunkId: 'general', lesson: 'DFS-215 Material' }];
        }
      }

      return response;
    } catch (error) {
      console.error(`Error in agent ${agentId}:`, error);
      
      // Log the error
      await mcpServer.logEvent({
        userId,
        agent: agentId,
        tool: 'error',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          viewId
        }
      });

      throw error;
    }
  }

  private buildSystemPrompt(basePrompt: string, context: any, agentId: string): string {
    // Replace variables in the prompt
    let prompt = basePrompt
      .replace(/\${platform_name}/g, 'DFS-215 Elite Learning Platform')
      .replace(/\${viewId}/g, context.route)
      .replace(/\${lesson_slug}/g, context.lessonId || '')
      .replace(/\${trace_id}/g, `trace_${Date.now()}`)
      .replace(/\${exam_mode}/g, context.route.includes('exam') ? 'true' : 'false');

    // Add agent-specific context
    if (agentId === 'proctorbot' && context.route.includes('exam')) {
      prompt += '\n\nIMPORTANT: You are currently in exam mode. Only provide policy clarifications and process guidance. Do not teach content or provide answers to exam questions.';
    }

    return prompt;
  }

  private validateAgentResponse(response: AgentResponse, profile: AgentProfile, context: any): void {
    // Basic validation logic - expand based on guardrails
    if (!response.role || !response.message) {
      throw new Error('Invalid agent response format');
    }

    // ProctorBot specific validation based on exam phase
    if (profile.id === 'proctorbot') {
      const examPhase = context?.examPhase || 'pre'; // pre, during, post
      
      if (examPhase === 'during' || context?.route?.includes('exam')) {
        // During exam: no content help, policy only
        const forbiddenPatterns = [
          'answer is', 'correct answer', 'the solution', 'explanation:',
          'balance billing', 'HMO', 'PPO', 'deductible', 'copay'
        ];
        
        const messageLower = response.message.toLowerCase();
        if (forbiddenPatterns.some(pattern => messageLower.includes(pattern))) {
          response.message = "I can only provide policy and process guidance during the exam. Please focus on the questions and submit when ready.";
          response.citations = [];
        }
      }
      
      // Enforce token limit for ProctorBot
      if (response.message.length > 1000) { // Rough estimate for 320 tokens
        response.message = response.message.substring(0, 1000) + '...';
      }
    }

    // Teaching agents must include citations for instructional content
    if ((profile.id === 'coachbot' || profile.id === 'studybuddy') && !context?.route?.includes('exam')) {
      const isInstructional = response.message.includes('explain') || response.message.includes('concept') || 
                             response.message.includes('insurance') || response.message.includes('regulation');
      
      if (isInstructional && (!response.citations || response.citations.length === 0)) {
        console.warn(`${profile.id} response lacks required citations for instructional content`);
      }
    }
  }

  async initializeDefaultAgents(): Promise<void> {
    const defaultAgents = [
      {
        id: "coachbot",
        displayName: "CoachBot",
        model: "gpt-5",
        temperature: 0.2,
        maxTokens: 768,
        guardrails: {
          requireCitations: true,
          denyDuringExam: false,
          tone: "professional, encouraging, exam-oriented"
        },
        systemPrompt: "You are CoachBot for the DFS-215 Elite Learning Platform. Always call MCP get_context(${viewId}) first, then retrieve_content as needed. Answer in ≤2 short paragraphs, then ask ONE quick-check. Offer ONE remediation step with a direct lesson/paragraph link. Include citations {chunkId, lesson, heading}. Never invent facts; if unsure, call retrieve_content again. Keep tone professional, encouraging, and exam-oriented."
      },
      {
        id: "studybuddy",
        displayName: "StudyBuddy", 
        model: "gpt-5",
        temperature: 0.35,
        maxTokens: 700,
        guardrails: {
          requireCitations: true,
          denyDuringExam: false,
          tone: "motivational but brief"
        },
        systemPrompt: "You are StudyBuddy for the DFS-215 Elite Learning Platform. Read MCP get_context(${viewId}) and recent attempts to find weak topics. Create a 7-day plan (Read → iFlash → 10-question quiz) starting today. Call iflash_generate(style:\"exam\") on current lesson/selection; store cards. Return a checklist of the next 3 tasks and an SRS due count. Include citations for any content guidance; keep tone motivating and brief."
      },
      {
        id: "proctorbot",
        displayName: "ProctorBot",
        model: "gpt-5", 
        temperature: 0.0,
        maxTokens: 320,
        guardrails: {
          requireCitations: false,
          denyDuringExam: true,
          tone: "neutral, brief, policy-first"
        },
        systemPrompt: "You are ProctorBot for the DFS-215 Elite Learning Platform. Pre-exam: show policy checklist and confirm readiness. During exam: answer policy/process questions only; no content coaching. Log blur/focus and anomalies via log_event with ${trace_id}. Post-exam: list top 3 weak topics with lesson links and citations. Remain neutral, brief, and consistent with exam integrity rules."
      }
    ];

    for (const agent of defaultAgents) {
      try {
        await storage.upsertAgentProfile(agent);
        console.log(`Initialized agent: ${agent.id}`);
      } catch (error) {
        console.error(`Failed to initialize agent ${agent.id}:`, error);
      }
    }
  }
}

export const agentService = new AgentService();
