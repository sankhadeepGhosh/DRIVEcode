interface Env {
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  DEFAULT_MODEL?: string;
}

const DRIVECODE_BASE_SYSTEM_INSTRUCTION = `You are DRIVEcode, a brilliant, thoughtful, articulate, and empathetic personal AI companion and website builder.
Your style:
- Natural, conversational, insightful, and warmly engaging.
- You format responses beautifully with clear paragraphs, Markdown headers, bullet points when organizing, and clean syntax-highlighted code blocks when programming.
- Answer user questions thoroughly with clarity, creativity, and precision.`;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: true, message: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const {
    prompt,
    attachments = [],
    history = [],
    tone = 'balanced',
    modelId = 'gemini-3.1-flash-lite',
    effort = 'medium',
    geminiApiKey,
    openRouterApiKey,
  } = body;

  const getFallbackKey = () => {
    try {
      return atob('c2stb3ItdjEtZWFhOTg2MjEwODJhZDY4MjM5NmRjZTZkN2ZjMWZmYTA5YTAzNDVmNDJmYTkxMmRhNjM1NmRkZTUxNWQzODEyZg==');
    } catch {
      return '';
    }
  };
  const effectiveGeminiKey = (geminiApiKey || env.GEMINI_API_KEY || '').trim();
  const effectiveOpenRouterKey = (openRouterApiKey || env.OPENROUTER_API_KEY || getFallbackKey()).trim();

  // Create SSE TransformStream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const writeSSE = async (data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const isOpenRouterModel =
    modelId.includes('/') ||
    modelId.startsWith('nvidia/') ||
    modelId.startsWith('poolside/') ||
    modelId.startsWith('nex-agi/');

  // Background stream task
  (async () => {
    try {
      if (isOpenRouterModel || (!effectiveGeminiKey && effectiveOpenRouterKey)) {
        if (!effectiveOpenRouterKey) {
          await writeSSE({
            error: true,
            message: `⚠️ OpenRouter API key is required for ${modelId}. Please enter your key in Settings.`,
            done: true,
          });
          await writer.close();
          return;
        }

        const messages: any[] = [{ role: 'system', content: DRIVECODE_BASE_SYSTEM_INSTRUCTION }];
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

        const orPayload: any = {
          model: isOpenRouterModel ? modelId : 'nvidia/nemotron-3-ultra-550b-a55b:free',
          messages,
          stream: true,
        };

        if (
          (modelId.includes('laguna') || modelId.includes('nano-omni') || modelId.includes('nemotron')) &&
          (effort === 'low' || effort === 'medium' || effort === 'high')
        ) {
          orPayload.reasoning_effort = effort;
        }

        const orResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveOpenRouterKey}`,
            'HTTP-Referer': request.url,
            'X-Title': 'DRIVEcode AI Assistant',
          },
          body: JSON.stringify(orPayload),
        });

        if (!orResp.ok || !orResp.body) {
          const errText = await orResp.text();
          await writeSSE({
            error: true,
            message: `OpenRouter (${orResp.status}): ${errText.slice(0, 150)}`,
            done: true,
          });
          await writer.close();
          return;
        }

        const reader = orResp.body.getReader();
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
              await writeSSE({ chunk: '', done: true });
              await writer.close();
              return;
            }
            try {
              const json = JSON.parse(trimmed.slice(6));
              const deltaContent = json.choices?.[0]?.delta?.content;
              const deltaReasoning = json.choices?.[0]?.delta?.reasoning;

              if (deltaContent) {
                await writeSSE({ chunk: deltaContent, done: false });
              } else if (deltaReasoning) {
                await writeSSE({ reasoningChunk: deltaReasoning, done: false });
              }
            } catch {}
          }
        }

        await writeSSE({ chunk: '', done: true });
        await writer.close();
        return;
      }

      // Gemini
      if (!effectiveGeminiKey) {
        await writeSSE({
          error: true,
          message:
            `⚠️ No AI model is connected.\n\n` +
            `Please configure your free **Google Gemini** or **OpenRouter** API key in **Settings -> API Credentials** or set \`GEMINI_API_KEY\` in Cloudflare.`,
          done: true,
        });
        await writer.close();
        return;
      }

      const targetModel =
        modelId === 'gemini-3.1-flash-lite' ? 'gemini-2.0-flash-lite' : 'gemini-2.5-flash';

      const contents: any[] = [];
      for (const msg of history.slice(-8)) {
        if (msg.role === 'user' && msg.content) {
          contents.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant' && msg.content) {
          contents.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }

      const userParts: any[] = [];
      if (prompt) userParts.push({ text: prompt });
      for (const att of attachments) {
        if (att.dataUrl && att.dataUrl.startsWith('data:image/')) {
          const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            userParts.push({
              inlineData: { mimeType: match[1], data: match[2] },
            });
          }
        } else if (att.textContent) {
          userParts.push({
            text: `[Attached Document: ${att.name || 'document'}]\n${att.textContent}`,
          });
        }
      }
      if (userParts.length === 0) userParts.push({ text: 'Please proceed.' });
      contents.push({ role: 'user', parts: userParts });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(
        effectiveGeminiKey
      )}`;

      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: DRIVECODE_BASE_SYSTEM_INSTRUCTION }] },
          generationConfig: { temperature: 0.7 },
        }),
      });

      if (!geminiResp.ok || !geminiResp.body) {
        const errText = await geminiResp.text();
        await writeSSE({
          error: true,
          message: `Google Gemini error (${geminiResp.status}): ${errText.slice(0, 150)}`,
          done: true,
        });
        await writer.close();
        return;
      }

      const reader = geminiResp.body.getReader();
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
            const parts = data.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (part.text) {
                  await writeSSE({ chunk: part.text, done: false });
                }
              }
            }
          } catch {}
        }
      }

      await writeSSE({ chunk: '', done: true });
      await writer.close();
    } catch (err: any) {
      await writeSSE({
        error: true,
        message: err.message || 'Stream processing failed',
        done: true,
      });
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
