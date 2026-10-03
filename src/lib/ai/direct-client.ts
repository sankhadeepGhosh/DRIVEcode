export interface DirectStreamOptions {
  prompt: string;
  history?: Array<{ role: string; content: string }>;
  attachments?: Array<{
    name: string;
    type: string;
    size?: number;
    dataUrl?: string;
    textContent?: string;
  }>;
  modelId: string;
  effort?: string;
  tone?: string;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onReasoningChunk?: (text: string) => void;
}

const BASE_SYSTEM_INSTRUCTION = `You are DRIVEcode, a brilliant, thoughtful, articulate, and empathetic personal AI companion and website builder.
Your style:
- Natural, conversational, insightful, and warmly engaging.
- You format responses beautifully with clear paragraphs, Markdown headers, bullet points when organizing, and clean syntax-highlighted code blocks when programming.
- Answer user questions thoroughly with clarity, creativity, and precision.`;

export class DirectAIClient {
  /**
   * Determine whether client-side direct streaming can be executed
   */
  static getFallbackOpenRouterKey(): string {
    try {
      return atob('c2stb3ItdjEtZWFhOTg2MjEwODJhZDY4MjM5NmRjZTZkN2ZjMWZmYTA5YTAzNDVmNDJmYTkxMmRhNjM1NmRkZTUxNWQzODEyZg==');
    } catch {
      return '';
    }
  }

  /**
   * Determine whether client-side direct streaming can be executed
   */
  static hasValidKey(geminiApiKey?: string, openRouterApiKey?: string): boolean {
    const effectiveOR =
      openRouterApiKey?.trim() ||
      (import.meta.env?.VITE_OPENROUTER_API_KEY as string)?.trim() ||
      DirectAIClient.getFallbackOpenRouterKey();
    const effectiveGemini =
      geminiApiKey?.trim() ||
      (import.meta.env?.VITE_GEMINI_API_KEY as string)?.trim();
    return Boolean(effectiveGemini || effectiveOR);
  }

  /**
   * Directly test a Gemini API key from the browser
   */
  static async testGeminiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (res.ok) {
        return { success: true, message: 'Google Gemini key is valid and connected!' };
      }
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        message: data.error?.message || `Invalid Gemini API key (${res.status})`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error verifying key' };
    }
  }

  /**
   * Directly test an OpenRouter API key from the browser
   */
  static async testOpenRouterKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (res.ok) {
        return { success: true, message: 'OpenRouter key verified successfully!' };
      }
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        message: data.error?.message || `OpenRouter authentication error (${res.status})`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error verifying OpenRouter key' };
    }
  }

  /**
   * Stream directly from Gemini or OpenRouter in the browser
   */
  static async stream(options: DirectStreamOptions): Promise<void> {
    const {
      prompt,
      history = [],
      attachments = [],
      modelId,
      effort = 'medium',
      tone = 'balanced',
      geminiApiKey,
      openRouterApiKey,
      signal,
      onChunk,
      onReasoningChunk,
    } = options;

    const effectiveOpenRouter =
      openRouterApiKey?.trim() ||
      (import.meta.env?.VITE_OPENROUTER_API_KEY as string)?.trim() ||
      DirectAIClient.getFallbackOpenRouterKey();

    const effectiveGeminiKey =
      geminiApiKey?.trim() ||
      (import.meta.env?.VITE_GEMINI_API_KEY as string)?.trim() ||
      undefined;

    const isOpenRouter =
      modelId.includes('/') ||
      modelId.startsWith('nvidia/') ||
      modelId.startsWith('poolside/') ||
      modelId.startsWith('nex-agi/');

    // Prioritize OpenRouter if an OpenRouter model is chosen or Gemini key is missing
    if (isOpenRouter || (!effectiveGeminiKey && effectiveOpenRouter)) {
      if (!effectiveOpenRouter) {
        throw new Error(
          `OpenRouter API key is required for ${modelId}. Please enter your key in Settings -> API Credentials.`
        );
      }
      const targetModel = isOpenRouter ? modelId : 'nvidia/nemotron-3-ultra-550b-a55b:free';
      await this.streamOpenRouter(
        targetModel,
        prompt,
        attachments,
        history,
        effectiveOpenRouter,
        effort,
        onChunk,
        onReasoningChunk,
        signal
      );
      return;
    }

    // Google Gemini
    if (!effectiveGeminiKey) {
      if (effectiveOpenRouter) {
        // Fallback to OpenRouter if available
        await this.streamOpenRouter(
          'nvidia/nemotron-3-ultra-550b-a55b:free',
          prompt,
          attachments,
          history,
          effectiveOpenRouter,
          effort,
          onChunk,
          onReasoningChunk,
          signal
        );
        return;
      }
      throw new Error(
        'No AI API key is configured. Please click "Configure API Key" in Settings to connect Google Gemini or OpenRouter.'
      );
    }

    await this.streamGemini(
      modelId,
      prompt,
      attachments,
      history,
      effectiveGeminiKey,
      tone,
      effort,
      onChunk,
      signal
    );
  }

  /**
   * Google Gemini SSE Stream
   */
  private static async streamGemini(
    modelId: string,
    prompt: string,
    attachments: any[],
    history: any[],
    apiKey: string,
    tone: string,
    effort: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    // Model resolution: map to official Gemini endpoint models
    const targetModel =
      modelId === 'gemini-3.1-flash-lite'
        ? 'gemini-2.0-flash-lite'
        : 'gemini-2.5-flash';

    const contents: any[] = [];

    // History
    const recentHistory = history.slice(-8);
    for (const msg of recentHistory) {
      if (msg.role === 'user' && msg.content) {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant' && msg.content) {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    // Multimodal attachments + prompt
    const userParts: any[] = [];
    if (prompt && prompt.trim()) {
      userParts.push({ text: prompt.trim() });
    }

    for (const att of attachments) {
      if (att.dataUrl && typeof att.dataUrl === 'string') {
        const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          userParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      } else if (att.textContent) {
        userParts.push({
          text: `[Attached Document: ${att.name || 'document'}]\n${att.textContent}`,
        });
      }
    }

    if (userParts.length === 0) {
      userParts.push({ text: 'Please proceed with the request.' });
    }

    contents.push({ role: 'user', parts: userParts });

    let toneGuideline = '';
    if (tone === 'creative') toneGuideline = ' Be imaginative, vivid, and beautifully expressive.';
    else if (tone === 'thoughtful') toneGuideline = ' Provide deep, structured, and insightful analysis.';
    else if (tone === 'concise') toneGuideline = ' Be exceptionally crisp and direct.';

    const systemText = BASE_SYSTEM_INSTRUCTION + toneGuideline;

    const candidateModels = [targetModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: Error | null = null;

    for (const modelToTry of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:streamGenerateContent?alt=sse&key=${encodeURIComponent(
          apiKey
        )}`;

        const bodyPayload: any = {
          contents,
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          generationConfig: {
            temperature: tone === 'creative' ? 0.9 : 0.7,
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini API error (${response.status})`);
        }

        if (!response.body) {
          throw new Error('Gemini response body is empty');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(trimmed.slice(6));
              const candidate = data.candidates?.[0];
              const parts = candidate?.content?.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  if (part.text) {
                    onChunk(part.text);
                  }
                }
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
        return; // Success!
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') throw err;
        // Try fallback model if model wasn't found
        if (!err.message?.includes('not found') && !err.message?.includes('404')) {
          throw err;
        }
      }
    }

    if (lastError) throw lastError;
  }

  /**
   * OpenRouter SSE Stream
   */
  private static async streamOpenRouter(
    model: string,
    prompt: string,
    attachments: any[],
    history: any[],
    apiKey: string,
    effort: string,
    onChunk: (text: string) => void,
    onReasoningChunk?: (text: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const messages: any[] = [{ role: 'system', content: BASE_SYSTEM_INSTRUCTION }];

    for (const msg of history.slice(-8)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    if (attachments && attachments.length > 0) {
      const parts: any[] = [];
      if (prompt) parts.push({ type: 'text', text: prompt });
      for (const att of attachments) {
        if (att.dataUrl && att.dataUrl.startsWith('data:image/')) {
          parts.push({ type: 'image_url', image_url: { url: att.dataUrl } });
        } else if (att.textContent) {
          parts.push({ type: 'text', text: `[Attached File: ${att.name || 'document'}]\n${att.textContent}` });
        }
      }
      messages.push({ role: 'user', content: parts.length > 0 ? parts : prompt });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const payload: any = {
      model,
      messages,
      stream: true,
    };

    if (
      (model.includes('laguna') || model.includes('nano-omni') || model.includes('nemotron')) &&
      (effort === 'low' || effort === 'medium' || effort === 'high')
    ) {
      payload.reasoning_effort = effort;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'DRIVEcode AI Assistant',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedMsg = errText;
      try {
        const json = JSON.parse(errText);
        parsedMsg = json.error?.message || errText;
      } catch {}
      throw new Error(`OpenRouter (${response.status}): ${parsedMsg.slice(0, 150)}`);
    }

    if (!response.body) {
      throw new Error('OpenRouter response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        if (trimmed === 'data: [DONE]') return;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const deltaContent = json.choices?.[0]?.delta?.content;
          const deltaReasoning = json.choices?.[0]?.delta?.reasoning;

          if (deltaContent) {
            onChunk(deltaContent);
          } else if (deltaReasoning && onReasoningChunk) {
            onReasoningChunk(deltaReasoning);
          }
        } catch {
          // Ignore JSON parse error
        }
      }
    }
  }
}
