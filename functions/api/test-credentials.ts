export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const { provider, apiKey } = await context.request.json() as any;

    if (!apiKey || typeof apiKey !== 'string') {
      return new Response(
        JSON.stringify({ success: false, message: 'API key is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (provider === 'google') {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (resp.ok) {
        return new Response(
          JSON.stringify({ success: true, message: 'Google Gemini key is valid and connected!' }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      const data = await resp.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ success: false, message: (data as any)?.error?.message || 'Invalid Gemini key' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (provider === 'openrouter') {
      const resp = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        return new Response(
          JSON.stringify({ success: true, message: 'OpenRouter key verified successfully!' }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, message: `OpenRouter authentication error (${resp.status})` }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid provider specified' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Verification error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
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
