// Chat proxy for the OnPress chat demo: keeps the OpenAI key on Cloudflare
// and streams the answer back to the browser.
//
// Browser  --POST {messages}-->  this Worker  --+ OPENAI_API_KEY-->  OpenAI
// Browser  <------- text/event-stream (OpenAI chunks as they come) -------
//
// Secrets:  OPENAI_API_KEY         (wrangler secret put OPENAI_API_KEY)
// Vars:     ALLOWED_ORIGINS        comma-separated, e.g. "https://example.com,https://www.example.com"
//           OPENAI_MODEL           default model, e.g. "gpt-6-luna"
//           OPENAI_REASONING_EFFORT  optional: none, low, medium, ... (omit for non-reasoning models)
//           SYSTEM_PROMPT          optional instructions for the model
//           MAX_MESSAGES, MAX_MESSAGE_CHARS, MAX_HISTORY_CHARS, MAX_OUTPUT_TOKENS  optional limits
// Binding:  RATE_LIMITER           optional Workers Rate Limiting binding (see wrangler.toml)

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = isAllowedOrigin(origin, env.ALLOWED_ORIGINS);
    const cors = allowed ? corsHeaders(origin) : {};

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: allowed ? 204 : 403, headers: cors });
    }
    if (request.method !== 'POST') {
      return fail(405, 'method_not_allowed', 'Send a POST request with {"messages": [...]}.', cors);
    }
    if (!allowed) {
      return fail(403, 'origin_not_allowed', 'This origin is not in ALLOWED_ORIGINS.', cors);
    }
    if (!env.OPENAI_API_KEY) {
      return fail(500, 'not_configured', 'OPENAI_API_KEY is not set: run "wrangler secret put OPENAI_API_KEY".', cors);
    }

    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) {
        return fail(429, 'rate_limited', 'Too many messages. Wait a minute and try again.', { ...cors, 'Retry-After': '60' });
      }
    }

    const limits = {
      messages: num(env.MAX_MESSAGES, 20),
      messageChars: num(env.MAX_MESSAGE_CHARS, 4000),
      historyChars: num(env.MAX_HISTORY_CHARS, 16000),
      outputTokens: num(env.MAX_OUTPUT_TOKENS, 1500),
    };

    let body;
    try {
      const raw = await request.text();
      if (raw.length > limits.historyChars * 2 + 4096) {
        return fail(413, 'too_large', 'Request body is too large.', cors);
      }
      body = JSON.parse(raw);
    } catch {
      return fail(400, 'bad_json', 'Body must be JSON: {"messages": [{"role": "user", "content": "..."}]}.', cors);
    }

    const checked = checkMessages(body && body.messages, limits);
    if (checked.error) {
      return fail(400, checked.error, checked.message, cors);
    }

    const messages = checked.messages;
    if (env.SYSTEM_PROMPT) {
      messages.unshift({ role: 'developer', content: String(env.SYSTEM_PROMPT) });
    }

    const payload = {
      model: env.OPENAI_MODEL || 'gpt-6-luna',
      messages,
      stream: true,
      max_completion_tokens: limits.outputTokens,
    };
    if (env.OPENAI_REASONING_EFFORT) {
      payload.reasoning_effort = env.OPENAI_REASONING_EFFORT;
    }

    let upstream;
    try {
      upstream = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.OPENAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return fail(502, 'upstream_unreachable', 'Could not reach OpenAI. Try again.', cors);
    }

    if (!upstream.ok || !upstream.body) {
      let message = 'OpenAI returned HTTP ' + upstream.status + '.';
      try {
        const data = await upstream.json();
        if (data && data.error && data.error.message) message = data.error.message;
      } catch {}
      const status = upstream.status === 429 ? 429 : 502;
      return fail(status, 'upstream_error', message, cors);
    }

    // Pass the OpenAI stream through untouched: no parsing, almost no CPU time.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};

function checkMessages(list, limits) {
  if (!Array.isArray(list) || list.length === 0) {
    return { error: 'no_messages', message: 'messages must be a non-empty array.' };
  }
  if (list.length > limits.messages) {
    return { error: 'too_many_messages', message: 'Send at most ' + limits.messages + ' messages.' };
  }
  const out = [];
  let total = 0;
  for (const m of list) {
    const role = m && m.role;
    const content = m && m.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) {
      return { error: 'bad_message', message: 'Each message needs role "user" or "assistant" and text content.' };
    }
    if (content.length > limits.messageChars) {
      return { error: 'message_too_long', message: 'A message may have at most ' + limits.messageChars + ' characters.' };
    }
    total += content.length;
    out.push({ role, content });
  }
  if (total > limits.historyChars) {
    return { error: 'history_too_long', message: 'The conversation may have at most ' + limits.historyChars + ' characters.' };
  }
  if (out[out.length - 1].role !== 'user') {
    return { error: 'bad_message', message: 'The last message must come from the user.' };
  }
  return { messages: out };
}

function isAllowedOrigin(origin, list) {
  if (!origin) return false;
  return String(list || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .includes(origin);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function fail(status, code, message, headers) {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function num(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
