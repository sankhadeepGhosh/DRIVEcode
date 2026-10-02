import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body parsers with generous limits for large attachments and website previews
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Handle PayloadTooLargeError gracefully
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    res.status(413).json({
      error: true,
      message: 'Request payload is too large. Please reduce attachment sizes or conversation length.',
    });
    return;
  }
  next(err);
});

// Lazy-initialized Gemini client
function getGeminiClient(userKey?: string): GoogleGenAI | null {
  const apiKey = userKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ROSE AI Master Multi-Model',
    version: '3.0.0',
    hasSystemApiKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenRouterApiKey: Boolean(process.env.OPENROUTER_API_KEY),
    supportedModels: [
      'gemini-3.1-flash-lite',
      'nvidia/nemotron-3.5-lightning:free',
      'poolside/laguna-s-2.1:free',
      'nex-agi/nex-n2.5-pro:free',
    ],
    timestamp: new Date().toISOString(),
  });
});

const ROSE_BASE_SYSTEM_INSTRUCTION = `You are ROSE, a brilliant, thoughtful, articulate, and empathetic personal AI companion and assistant.
Your style:
- Natural, conversational, insightful, and warmly engaging.
- You format responses beautifully with clear paragraphs, Markdown headers, bullet points when organizing, and clean syntax-highlighted code blocks when programming.
- You avoid robotic clichés, generic corporate filler, or stiff preambles. You speak like a thoughtful thought partner who loves exploring ideas and solving problems together with the user.
- Answer user questions thoroughly with clarity, creativity, and precision.`;

// Credential Test Endpoint
app.post('/api/test-credentials', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ success: false, message: 'API key is required' });
    return;
  }

  if (provider === 'google') {
    try {
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const resp = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'Hi',
        config: { maxOutputTokens: 5 },
      });
      if (resp && resp.text !== undefined) {
        res.json({ success: true, message: 'Google Gemini key is valid and connected' });
        return;
      }
      res.json({ success: false, message: 'Failed to verify Gemini key' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.json({ success: false, message: msg.slice(0, 120) });
    }
    return;
  }

  if (provider === 'openrouter') {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (response.ok) {
        res.json({ success: true, message: 'OpenRouter key verified successfully' });
      } else {
        const errorText = await response.text();
        res.json({ success: false, message: `OpenRouter authentication error (${response.status})` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.json({ success: false, message: msg.slice(0, 120) });
    }
    return;
  }

  res.status(400).json({ success: false, message: 'Invalid provider specified' });
});

// Real-Time Web Research Search Endpoint (DuckDuckGo + Wikipedia proxy fallback)
app.post('/api/research/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Search query is required' });
    return;
  }

  try {
    const sources: Array<{ title: string; url: string; domain: string; snippet: string }> = [];

    // 1. Query DuckDuckGo Instant Answer API
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const ddgResp = await fetch(ddgUrl, { headers: { 'User-Agent': 'ROSE-Deep-Research-Agent/1.0' } });
      if (ddgResp.ok) {
        const data = await ddgResp.json();
        if (data.AbstractText && data.AbstractURL) {
          const urlObj = new URL(data.AbstractURL);
          sources.push({
            title: data.Heading || query,
            url: data.AbstractURL,
            domain: urlObj.hostname,
            snippet: data.AbstractText,
          });
        }
        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics.slice(0, 4)) {
            if (topic.Text && topic.FirstURL) {
              try {
                const u = new URL(topic.FirstURL);
                sources.push({
                  title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 50),
                  url: topic.FirstURL,
                  domain: u.hostname,
                  snippet: topic.Text,
                });
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.warn('[ROSE Server] DuckDuckGo search error:', e);
    }

    // 2. Query Wikipedia OpenSearch API for authoritative encyclopedia grounding
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json`;
      const wikiResp = await fetch(wikiUrl, { headers: { 'User-Agent': 'ROSE-Deep-Research-Agent/1.0' } });
      if (wikiResp.ok) {
        const wikiData = await wikiResp.json();
        const titles = wikiData[1] || [];
        const snippets = wikiData[2] || [];
        const links = wikiData[3] || [];

        for (let i = 0; i < titles.length; i++) {
          if (links[i]) {
            sources.push({
              title: titles[i],
              url: links[i],
              domain: 'wikipedia.org',
              snippet: snippets[i] || `Reference page for ${titles[i]}`,
            });
          }
        }
      }
    } catch (e) {
      console.warn('[ROSE Server] Wikipedia search error:', e);
    }

    // If no results returned from public APIs, provide a structured web query card
    if (sources.length === 0) {
      sources.push({
        title: `Web Overview: ${query}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        domain: 'duckduckgo.com',
        snippet: `Real-time search index for "${query}" across web sources, documentation, and public reporting.`,
      });
    }

    res.json({ sources, query, completedAt: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg, sources: [] });
  }
});

// OpenRouter streaming helper
async function streamOpenRouter(
  model: string,
  prompt: string,
  attachments: any[],
  history: any[],
  openRouterApiKey: string,
  effort: string,
  res: express.Response
) {
  const messages: any[] = [];
  messages.push({ role: 'system', content: ROSE_BASE_SYSTEM_INSTRUCTION });

  const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  if (Array.isArray(attachments) && attachments.length > 0) {
    const userParts: any[] = [];
    if (prompt) {
      userParts.push({ type: 'text', text: prompt });
    }
    for (const att of attachments) {
      if (att.dataUrl && typeof att.dataUrl === 'string' && att.dataUrl.startsWith('data:image/')) {
        userParts.push({
          type: 'image_url',
          image_url: { url: att.dataUrl },
        });
      } else if (att.textContent) {
        userParts.push({
          type: 'text',
          text: `[Attached File: ${att.name || 'document'}]\n${att.textContent}`,
        });
      }
    }
    messages.push({ role: 'user', content: userParts.length > 0 ? userParts : prompt });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const payload: any = {
    model,
    messages,
    stream: true,
  };

  // Only pass reasoning parameters if supported
  if (model === 'poolside/laguna-s-2.1:free' && (effort === 'low' || effort === 'medium' || effort === 'high')) {
    payload.reasoning_effort = effort;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterApiKey}`,
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'ROSE AI Assistant',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter (${response.status}): ${errText.slice(0, 150)}`);
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
      if (trimmed === 'data: [DONE]') {
        res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
        return;
      }
      try {
        const json = JSON.parse(trimmed.slice(6));
        const deltaContent = json.choices?.[0]?.delta?.content;
        const deltaReasoning = json.choices?.[0]?.delta?.reasoning;

        if (deltaContent) {
          res.write(`data: ${JSON.stringify({ chunk: deltaContent, done: false })}\n\n`);
        } else if (deltaReasoning) {
          // SSE keepalive during reasoning generation
          res.write(`: thinking\n\n`);
        }
      } catch {}
    }
  }

  res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
}

// Streaming Chat Endpoint with Multi-Model Support
app.post('/api/chat', async (req, res) => {
  const {
    prompt,
    attachments = [],
    history = [],
    tone = 'balanced',
    modelId = 'gemini-3.1-flash-lite',
    effort = 'medium',
    geminiApiKey,
    openRouterApiKey,
  } = req.body;

  if ((!prompt || typeof prompt !== 'string') && (!Array.isArray(attachments) || attachments.length === 0)) {
    res.status(400).json({ error: 'Prompt or attachment is required' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let toneAddition = '';
  if (tone === 'thoughtful') {
    toneAddition = ' Tone guideline: Provide deep, nuanced, introspective, and comprehensive analysis.';
  } else if (tone === 'creative') {
    toneAddition = ' Tone guideline: Be imaginative, expressive, poetic, and vivid in your thinking.';
  } else if (tone === 'concise') {
    toneAddition = ' Tone guideline: Be exceptionally crisp, direct, and brief without sacrificing substance.';
  }
  const systemInstruction = ROSE_BASE_SYSTEM_INSTRUCTION + toneAddition;

  // 1. If OpenRouter model selected
  const isOpenRouterModel =
    modelId === 'nvidia/nemotron-3.5-lightning:free' ||
    modelId === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' ||
    modelId === 'poolside/laguna-s-2.1:free' ||
    modelId === 'nex-agi/nex-n2.5-pro:free';

  if (isOpenRouterModel) {
    const effectiveOpenRouterKey = (typeof openRouterApiKey === 'string' && openRouterApiKey.trim())
      ? openRouterApiKey.trim()
      : process.env.OPENROUTER_API_KEY?.trim();
    if (!effectiveOpenRouterKey) {
      res.write(
        `data: ${JSON.stringify({
          error: true,
          message: `${modelId} requires an OpenRouter API key. Please configure your key in Settings or environment.`,
          done: true,
        })}\n\n`
      );
      res.end();
      return;
    }

    try {
      await streamOpenRouter(modelId, prompt || '', attachments, history, effectiveOpenRouterKey, effort, res);
      res.end();
      return;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.write(
        `data: ${JSON.stringify({
          error: true,
          message: `${modelId} is currently unavailable. ${errMsg.slice(0, 100)}`,
          done: true,
        })}\n\n`
      );
      res.end();
      return;
    }
  }

  // 2. Google Gemini model
  const ai = getGeminiClient(
    (typeof geminiApiKey === 'string' && geminiApiKey.trim()) ? geminiApiKey.trim() : undefined
  );
  if (ai) {
    // Only use officially supported models for Gemini tasks
    const requestedModel = modelId === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';
    const candidateModels = [requestedModel, requestedModel === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite'];
    for (const modelName of candidateModels) {
      try {
        const contents: any[] = [];
        const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
        for (const msg of recentHistory) {
          if (msg.role === 'user' && msg.content) {
            contents.push({ role: 'user', parts: [{ text: msg.content }] });
          } else if (msg.role === 'assistant' && msg.content) {
            contents.push({ role: 'model', parts: [{ text: msg.content }] });
          }
        }

        // Build rich multimodal user parts
        const userParts: any[] = [];
        if (prompt && typeof prompt === 'string' && prompt.trim()) {
          userParts.push({ text: prompt.trim() });
        }

        if (Array.isArray(attachments)) {
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
            } else if (att.textContent && typeof att.textContent === 'string') {
              userParts.push({
                text: `[Attached Document: ${att.name || 'document'}]\n${att.textContent}`,
              });
            }
          }
        }

        if (userParts.length === 0) {
          userParts.push({ text: prompt || 'Please analyze the attached document or image.' });
        }

        contents.push({ role: 'user', parts: userParts });

        const config: any = {
          systemInstruction,
          temperature: tone === 'creative' ? 0.9 : 0.7,
        };

        // Capability-aware thinking budget for gemini-3.1-flash-lite
        if (modelName === 'gemini-3.1-flash-lite' && (effort === 'low' || effort === 'medium' || effort === 'high')) {
          config.thinkingConfig = {
            thinkingBudget: effort === 'low' ? 1024 : effort === 'medium' ? 4096 : 8192,
          };
        }

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config,
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ chunk: text, done: false })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
        res.end();
        return;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (!errMsg.includes('503') && !errMsg.includes('high demand')) {
          console.warn(`[ROSE Server] Gemini ${modelName} fallback attempt: ${errMsg.slice(0, 80)}`);
        }
      }
    }
  }

  // 3. No model connected — return a clear error instead of silently simulating
  const isGeminiModel = modelId === 'gemini-3.8-flash' || modelId === 'gemini-3.1-flash-lite';
  const missingKey = isGeminiModel
    ? 'GEMINI_API_KEY'
    : 'OPENROUTER_API_KEY';
  const setupUrl = isGeminiModel
    ? 'https://aistudio.google.com/'
    : 'https://openrouter.ai/';

  res.write(
    `data: ${JSON.stringify({
      error: true,
      message:
        `⚠️ No AI model is connected.\n\n` +
        `**${modelId}** requires a valid **${missingKey}** but none was found.\n\n` +
        `To fix this:\n` +
        `1. Get a free API key at [${setupUrl}](${setupUrl})\n` +
        `2. Add it to your \`.env\` file as \`${missingKey}="your-key"\`\n` +
        `3. Restart the server with \`npm run dev\``,
      done: true,
    })}\n\n`
  );
  res.end();
});

// Setup Vite middleware or static serving
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ROSE AI] Master Multi-Model Server running on http://localhost:${PORT}`);
  });
}

initServer();
