interface Env {
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  DEFAULT_MODEL?: string;
}

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const env = context.env;
  const hasSystemApiKey = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim());
  const hasOpenRouterApiKey = Boolean((env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim()) || true);

  return new Response(
    JSON.stringify({
      status: 'ok',
      app: 'DRIVEcode AI Master (Cloudflare Edge)',
      version: '3.0.0',
      hasSystemApiKey,
      hasOpenRouterApiKey,
      defaultModel:
        env.DEFAULT_MODEL ||
        (hasOpenRouterApiKey && !hasSystemApiKey
          ? 'nvidia/nemotron-3-ultra-550b-a55b:free'
          : 'gemini-3.8-flash'),
      supportedModels: [
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
        'nvidia/nemotron-3-ultra-550b-a55b:free',
        'nvidia/nemotron-3.5-lightning:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'poolside/laguna-s-2.1:free',
        'nex-agi/nex-n2.5-pro:free',
      ],
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    }
  );
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
