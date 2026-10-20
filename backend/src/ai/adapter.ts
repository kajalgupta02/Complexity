import { config } from '../config/env.js';
import { buildOptimizationPrompt, PROMPT_VERSION } from './prompt.js';
import { validateAndParseAIResponse } from './validator.js';
import type {
  AIAdapter,
  OptimizationPromptInput,
  OptimizationResultPayload,
  AIProviderMetadata,
} from './types.js';

export class AIProviderUnavailableError extends Error {
  public readonly statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = 'AIProviderUnavailableError';
  }
}

export class AIProviderRequestError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'AIProviderRequestError';
    this.statusCode = statusCode;
  }
}

/**
 * Standard AI Provider Adapter supporting Google Gemini and OpenAI.
 * Uses native fetch with AbortController timeout and 1-shot retry on transient failures.
 */
export class ProductionAIAdapter implements AIAdapter {
  private readonly provider: 'gemini' | 'openai' | 'disabled';
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor() {
    this.provider = config.aiProvider;
    this.model = config.aiModel;
    this.timeoutMs = config.aiTimeoutMs;
  }

  async generateOptimization(
    input: OptimizationPromptInput,
    options?: { signal?: AbortSignal }
  ): Promise<{ payload: OptimizationResultPayload; metadata: AIProviderMetadata }> {
    if (this.provider === 'disabled') {
      throw new AIProviderUnavailableError(
        'AI optimization provider is unconfigured. To enable AI refactoring, set GEMINI_API_KEY or OPENAI_API_KEY in backend environment.'
      );
    }

    const { systemPrompt, userPrompt } = buildOptimizationPrompt(input);

    const executeCall = async () => {
      if (this.provider === 'gemini') {
        return this.callGemini(systemPrompt, userPrompt, options?.signal);
      } else {
        return this.callOpenAI(systemPrompt, userPrompt, options?.signal);
      }
    };

    // Bounded retry: 1 retry on 503 or 429
    let rawText: string;
    try {
      rawText = await executeCall();
    } catch (firstErr) {
      if (firstErr instanceof AIProviderRequestError && [429, 503, 504].includes(firstErr.statusCode)) {
        // Wait 500ms before single retry
        await new Promise((r) => setTimeout(r, 500));
        rawText = await executeCall();
      } else {
        throw firstErr;
      }
    }

    const payload = validateAndParseAIResponse(rawText);

    return {
      payload,
      metadata: {
        provider: this.provider,
        model: this.model,
        promptVersion: PROMPT_VERSION,
      },
    };
  }

  private async callGemini(
    systemPrompt: string,
    userPrompt: string,
    externalSignal?: AbortSignal
  ): Promise<string> {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      throw new AIProviderUnavailableError(
        'GEMINI_API_KEY is not configured on the backend server.'
      );
    }

    const controller = new AbortController();
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort());
    }
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, any>;
        const msg = errorData?.error?.message || `Upstream Gemini API returned HTTP ${response.status}`;
        throw new AIProviderRequestError(msg, response.status);
      }

      const data = (await response.json()) as Record<string, any>;
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText || typeof candidateText !== 'string') {
        throw new AIProviderRequestError('Gemini response did not contain text candidates.');
      }

      return candidateText;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof AIProviderRequestError || err instanceof AIProviderUnavailableError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderRequestError(`Upstream AI request timed out after ${this.timeoutMs / 1000}s.`, 504);
      }
      throw new AIProviderRequestError(
        `Failed to reach AI provider: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
    externalSignal?: AbortSignal
  ): Promise<string> {
    const apiKey = config.openaiApiKey;
    if (!apiKey) {
      throw new AIProviderUnavailableError(
        'OPENAI_API_KEY is not configured on the backend server.'
      );
    }

    const controller = new AbortController();
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort());
    }
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const endpoint = 'https://api.openai.com/v1/chat/completions';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, any>;
        const msg = errorData?.error?.message || `Upstream OpenAI API returned HTTP ${response.status}`;
        throw new AIProviderRequestError(msg, response.status);
      }

      const data = (await response.json()) as Record<string, any>;
      const content = data?.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string') {
        throw new AIProviderRequestError('OpenAI response did not contain message content.');
      }

      return content;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof AIProviderRequestError || err instanceof AIProviderUnavailableError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderRequestError(`Upstream AI request timed out after ${this.timeoutMs / 1000}s.`, 504);
      }
      throw new AIProviderRequestError(
        `Failed to reach AI provider: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }
}
