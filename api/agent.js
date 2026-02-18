// ============================================================
// MEITHEAL AGENT
// The AI that builds and evolves the community platform.
// Provider-agnostic: works with Anthropic, OpenAI, Groq, Ollama.
// ============================================================

// ---- Cost table (USD per 1M tokens) -------------------------
const COSTS = {
  'claude-opus-4-6':          { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6':        { input:  3.00, output: 15.00 },
  'claude-haiku-4-5-20251001':{ input:  0.25, output:  1.25 },
  'gpt-4o':                   { input:  2.50, output: 10.00 },
  'gpt-4o-mini':              { input:  0.15, output:  0.60 },
  'deepseek-chat':            { input:  0.27, output:  1.10 }, // DeepSeek V3
  'deepseek-reasoner':        { input:  0.55, output:  2.19 }, // DeepSeek R1
  'llama3':                   { input:  0,    output:  0    }, // local
};

function calcCost(model, promptTokens, completionTokens) {
  const c = COSTS[model] || { input: 0, output: 0 };
  return (promptTokens * c.input + completionTokens * c.output) / 1_000_000;
}

// ---- Tool definitions ---------------------------------------
const TOOLS = [
  {
    name: 'read_file',
    description: 'Read a file from the community repo.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path, e.g. index.html' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Create or update a file in the repo. Triggers auto-deploy on save.',
    parameters: {
      type: 'object',
      properties: {
        path:           { type: 'string', description: 'File path' },
        content:        { type: 'string', description: 'Full file content' },
        commit_message: { type: 'string', description: 'Short description of what changed and why' }
      },
      required: ['path', 'content', 'commit_message']
    }
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the repo.',
    parameters: {
      type: 'object',
      properties: {
        path:           { type: 'string' },
        commit_message: { type: 'string' }
      },
      required: ['path', 'commit_message']
    }
  },
  {
    name: 'list_files',
    description: 'List all files in the repo, or in a specific directory.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path, or empty for root' }
      }
    }
  },
  {
    name: 'run_sql',
    description: 'Run SQL against the community database. Use for schema changes, data fixes. Always confirm before destructive operations.',
    parameters: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL to execute' }
      },
      required: ['sql']
    }
  },
  {
    name: 'query_data',
    description: 'Read data from a database table.',
    parameters: {
      type: 'object',
      properties: {
        table:  { type: 'string' },
        select: { type: 'string', description: 'Columns to select, default *' },
        filter: { type: 'string', description: 'PostgREST filter, e.g. status=eq.new' },
        limit:  { type: 'number' }
      },
      required: ['table']
    }
  },
  {
    name: 'get_feedback',
    description: 'Get open feedback from community members.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'update_feedback',
    description: 'Action or decline a feedback item.',
    parameters: {
      type: 'object',
      properties: {
        id:     { type: 'string' },
        status: { type: 'string', enum: ['actioned', 'declined'] },
        note:   { type: 'string', description: 'Response to show the member' }
      },
      required: ['id', 'status']
    }
  },
  {
    name: 'update_memory',
    description: 'Update AGENT.md — the persistent memory of what has been built and why. Keep it concise and factual.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Full new content of AGENT.md' }
      },
      required: ['content']
    }
  },
  {
    name: 'get_settings',
    description: 'Read community settings.',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'update_setting',
    description: 'Update a community setting.',
    parameters: {
      type: 'object',
      properties: {
        key:   { type: 'string' },
        value: { type: 'string' }
      },
      required: ['key', 'value']
    }
  }
];

// ---- Tool execution -----------------------------------------
async function executeTool(name, args, env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH } = env;
  const branch = GITHUB_BRANCH || 'main';
  const sbHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };

  // GitHub API helpers
  async function ghGet(path) {
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${branch}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!r.ok) throw new Error(`GitHub GET ${path}: ${r.status}`);
    return r.json();
  }

  async function ghPut(path, content, message, sha) {
    const body = { message, content: Buffer.from(content).toString('base64'), branch };
    if (sha) body.sha = sha;
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const t = await r.text(); throw new Error(`GitHub PUT ${path}: ${r.status} ${t}`); }
    return r.json();
  }

  async function ghDelete(path, message) {
    const file = await ghGet(path);
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sha: file.sha, branch })
    });
    if (!r.ok) throw new Error(`GitHub DELETE ${path}: ${r.status}`);
    return { deleted: path };
  }

  switch (name) {
    case 'read_file': {
      const file = await ghGet(args.path);
      const content = Buffer.from(file.content, 'base64').toString('utf-8');
      return { path: args.path, content };
    }

    case 'write_file': {
      let sha;
      try { const f = await ghGet(args.path); sha = f.sha; } catch {}
      await ghPut(args.path, args.content, args.commit_message, sha);
      return { written: args.path, message: args.commit_message };
    }

    case 'delete_file': {
      return ghDelete(args.path, args.commit_message);
    }

    case 'list_files': {
      const path = args.path || '';
      const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees/${branch}?recursive=1`, {
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      const data = await r.json();
      const files = (data.tree || [])
        .filter(f => f.type === 'blob' && (!path || f.path.startsWith(path)))
        .map(f => f.path);
      return { files };
    }

    case 'run_sql': {
      const r = await fetch(`https://api.supabase.com/v1/projects/${extractRef(SUPABASE_URL)}/database/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: args.sql })
      });
      const result = await r.json();
      return { result };
    }

    case 'query_data': {
      let url = `${SUPABASE_URL}/rest/v1/${args.table}?select=${args.select || '*'}`;
      if (args.filter) url += `&${args.filter}`;
      if (args.limit)  url += `&limit=${args.limit}`;
      const r = await fetch(url, { headers: sbHeaders });
      return await r.json();
    }

    case 'get_feedback': {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/feedback?status=eq.new&select=*,author:members(display_name,email)&order=created_at.asc`, { headers: sbHeaders });
      return await r.json();
    }

    case 'update_feedback': {
      await fetch(`${SUPABASE_URL}/rest/v1/feedback?id=eq.${args.id}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({ status: args.status, admin_note: args.note || null })
      });
      return { updated: args.id, status: args.status };
    }

    case 'update_memory': {
      let sha;
      try { const f = await ghGet('AGENT.md'); sha = f.sha; } catch {}
      await ghPut('AGENT.md', args.content, 'Update agent memory', sha);
      return { updated: 'AGENT.md' };
    }

    case 'get_settings': {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, { headers: sbHeaders });
      const rows = await r.json();
      return Object.fromEntries((rows || []).map(r => [r.key, r.value]));
    }

    case 'update_setting': {
      await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${args.key}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({ value: args.value, updated_at: new Date().toISOString() })
      });
      return { updated: args.key, value: args.value };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function extractRef(supabaseUrl) {
  // https://xyzxyz.supabase.co → xyzxyz
  return supabaseUrl.replace('https://', '').split('.')[0];
}

// ---- Provider adapters --------------------------------------

// Common format internally: { role, content } where content is string or array of parts

async function callAnthropic(messages, systemPrompt, model, apiKey) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: 8096,
      system: systemPrompt,
      messages,
      tools: TOOLS.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters
      }))
    })
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`Anthropic: ${r.status} ${t}`); }
  const data = await r.json();

  // Normalise to { text, toolCalls, usage, stopReason }
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const toolCalls = data.content.filter(b => b.type === 'tool_use').map(b => ({
    id: b.id, name: b.name, args: b.input
  }));
  return {
    text,
    toolCalls,
    usage: { prompt: data.usage.input_tokens, completion: data.usage.output_tokens },
    stopReason: data.stop_reason
  };
}

async function callOpenAI(messages, systemPrompt, model, apiKey, baseUrl) {
  const url = (baseUrl || 'https://api.openai.com') + '/v1/chat/completions';
  const oaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => {
      if (m.role === 'tool') return { role: 'tool', tool_call_id: m.tool_call_id, content: JSON.stringify(m.content) };
      if (Array.isArray(m.content)) {
        // convert tool_result parts back to tool messages
        return m;
      }
      return { role: m.role, content: m.content, tool_calls: m.tool_calls };
    })
  ];
  const body = {
    model,
    messages: oaiMessages,
    tools: TOOLS.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
    tool_choice: 'auto'
  };
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text(); throw new Error(`OpenAI: ${r.status} ${t}`); }
  const data = await r.json();
  const msg = data.choices[0].message;
  const text = msg.content || '';
  const toolCalls = (msg.tool_calls || []).map(tc => ({
    id: tc.id, name: tc.function.name, args: JSON.parse(tc.function.arguments || '{}')
  }));
  return {
    text,
    toolCalls,
    usage: { prompt: data.usage?.prompt_tokens || 0, completion: data.usage?.completion_tokens || 0 },
    stopReason: data.choices[0].finish_reason
  };
}

// ---- Main agent loop ----------------------------------------

async function runAgent(userMessage, conversationId, env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = env;
  const sbHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  // Load settings (provider, model, api key)
  const settingsR = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, { headers: sbHeaders });
  const settingsRows = await settingsR.json();
  const settings = Object.fromEntries((settingsRows || []).map(r => [r.key, r.value]));

  const provider  = settings.ai_provider || 'anthropic';
  const model     = settings.ai_model    || 'claude-sonnet-4-6';
  const apiKey    = settings.ai_api_key  || env.AI_API_KEY || env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY;
  const ollamaUrl = settings.ollama_url  || env.OLLAMA_URL || 'http://localhost:11434';

  // Load or create conversation
  let conversation = null;
  if (conversationId) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${conversationId}&select=*`, { headers: sbHeaders });
    const rows = await r.json();
    conversation = rows[0] || null;
  }
  if (!conversation) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
      method: 'POST', headers: sbHeaders,
      body: JSON.stringify({ messages: [] })
    });
    const rows = await r.json();
    conversation = rows[0];
  }

  // Load AGENT.md
  let agentMemory = '';
  try {
    const ghR = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/AGENT.md?ref=${env.GITHUB_BRANCH || 'main'}`, {
      headers: { 'Authorization': `Bearer ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (ghR.ok) {
      const f = await ghR.json();
      agentMemory = Buffer.from(f.content, 'base64').toString('utf-8');
    }
  } catch {}

  // Build system prompt
  const systemPrompt = buildSystemPrompt(settings, agentMemory);

  // Build message history (provider-native format)
  const history = conversation.messages || [];
  let messages = buildMessages(history, provider);

  // Add user message
  const userMsg = { role: 'user', content: userMessage };
  messages.push(userMsg);
  const historyEntry = { role: 'user', content: userMessage, ts: new Date().toISOString() };

  // Agent loop
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let finalText = '';
  const toolLog = [];

  for (let turn = 0; turn < 10; turn++) {
    let response;
    if (provider === 'anthropic') {
      response = await callAnthropic(messages, systemPrompt, model, apiKey);
    } else {
      // openai-compatible: openai, groq, ollama
      const baseUrl = provider === 'groq'     ? 'https://api.groq.com/openai'
                    : provider === 'deepseek' ? 'https://api.deepseek.com'
                    : provider === 'ollama'   ? ollamaUrl
                    : null; // default openai
      response = await callOpenAI(messages, systemPrompt, model, apiKey, baseUrl);
    }

    totalPromptTokens     += response.usage.prompt;
    totalCompletionTokens += response.usage.completion;

    if (response.text) finalText += response.text;

    if (response.toolCalls.length === 0) break; // done

    // Execute tool calls
    const toolResults = [];
    for (const tc of response.toolCalls) {
      let result;
      try {
        result = await executeTool(tc.name, tc.args, env);
      } catch (e) {
        result = { error: e.message };
      }
      toolLog.push({ tool: tc.name, args: tc.args, result });
      toolResults.push({ id: tc.id, name: tc.name, result });
    }

    // Append assistant turn + tool results to messages (provider-specific format)
    if (provider === 'anthropic') {
      messages.push({ role: 'assistant', content: [
        ...(response.text ? [{ type: 'text', text: response.text }] : []),
        ...response.toolCalls.map(tc => ({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args }))
      ]});
      messages.push({ role: 'user', content: toolResults.map(tr => ({
        type: 'tool_result', tool_use_id: tr.id, content: JSON.stringify(tr.result)
      }))});
    } else {
      messages.push({ role: 'assistant', content: response.text || null, tool_calls: response.toolCalls.map(tc => ({
        id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.args) }
      }))});
      for (const tr of toolResults) {
        messages.push({ role: 'tool', tool_call_id: tr.id, content: JSON.stringify(tr.result) });
      }
    }
  }

  // Track cost
  const costUsd = calcCost(model, totalPromptTokens, totalCompletionTokens);
  await fetch(`${SUPABASE_URL}/rest/v1/ai_usage`, {
    method: 'POST', headers: sbHeaders,
    body: JSON.stringify({
      provider, model,
      prompt_tokens: totalPromptTokens,
      completion_tokens: totalCompletionTokens,
      cost_usd: costUsd,
      triggered_by: 'admin_chat',
      conversation_id: conversation.id
    })
  });

  // Save conversation
  const updatedHistory = [
    ...history,
    historyEntry,
    { role: 'assistant', content: finalText, tool_log: toolLog.length ? toolLog : undefined, ts: new Date().toISOString() }
  ];
  await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${conversation.id}`, {
    method: 'PATCH', headers: sbHeaders,
    body: JSON.stringify({ messages: updatedHistory, updated_at: new Date().toISOString() })
  });

  return {
    text: finalText,
    toolLog,
    conversationId: conversation.id,
    usage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens, costUsd }
  };
}

function buildMessages(history, provider) {
  // Convert stored history to provider message format
  return history.map(m => ({ role: m.role, content: m.content }));
}

function buildSystemPrompt(settings, agentMemory) {
  const communityName = settings.community_name || 'this community';
  return `You are the builder and steward of ${communityName}'s community platform.

Your job is to build, maintain, and evolve this platform through conversation with the community admin. You write HTML, CSS, and JavaScript files. You create and modify database tables. You do not use frameworks — plain HTML/JS files that work directly in the browser.

## What you can do
- Create new pages (write_file with .html extension)
- Modify existing pages (read_file first, then write_file)
- Add database tables or columns (run_sql)
- Query community data (query_data)
- Triage and action member feedback (get_feedback, update_feedback)
- Update your own memory (update_memory — keep AGENT.md concise and factual)

## Code conventions
- Each page is a self-contained .html file
- Styles go in a <style> block in the <head>, or use theme.css for shared design tokens
- Data access goes through supabase.js functions
- Auth is handled in js/auth.js — include it on every member-facing page
- Keep pages simple. No frameworks. No build step.
- The design system is in theme.css — use CSS variables like var(--color-primary)

## Integration rules — always wire things in
- Never create an orphaned page. If you build something new, always update the navigation so users can reach it.
- If a member-facing page exists (home.html, index.html), add a link to the new page there.
- Every new page must have a back link or nav that returns the user to the main platform.
- If you add a feature, check whether any existing pages should reference it and update them.
- The user should never have to manually copy a URL to find something you built — it should always be reachable by clicking through the site.

## Safety rules
- Never delete database tables or drop columns without explicit admin confirmation
- Never expose the service role key in client-side code
- Never remove authentication from member-facing pages
- Always read a file before modifying it
- Describe what you're about to do before doing it for significant changes

## Your memory
${agentMemory ? agentMemory : '(No memory yet — this community is just getting started.)'}

Be warm, practical, and direct. You are a craftsperson building something real for real people.

## How to respond
- Do NOT narrate your steps as you go ("Let me check...", "Now I'll look at...", "I can see that..."). Just do the work silently, then report the outcome.
- Start your response ONLY after all tool calls are complete.
- Lead with what you built, not how you built it.
- Keep responses concise — a few sentences and a bullet list of what changed is enough.

## After every action, always end your response with a clear "what now" section

If you created or modified files, end with something like:

---
**Done.** I've created \`directory.html\` — deploying now.

**→ See it live in ~30 seconds:** https://[repo-hostname].vercel.app/directory.html

Refresh that link until it loads. Want me to change anything?

---

Rules for the "what now" section:
- Always include the full live URL (use the community's deployed hostname — check settings for \`site_url\`, or infer from context)
- Always say how long deployment takes (~30 seconds for Vercel)
- Always say what the user should do next (refresh, visit the link, etc.)
- If you ran SQL or changed settings (no page to visit), say what changed and what the user will notice
- Keep it short — 2–4 lines max
- Never end a response without telling the user what to do next`;
}

// ---- Vercel handler -----------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Auth: verify the request has a valid Supabase token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No auth token' });

  // Verify token and get admin
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const userR = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': process.env.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!userR.ok) return res.status(401).json({ error: 'Invalid token' });
  const user = await userR.json();

  // Check member is admin
  const memberR = await fetch(`${SUPABASE_URL}/rest/v1/members?auth_id=eq.${user.id}&select=id,role`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  const members = await memberR.json();
  const member = members[0];
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { message, conversationId } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const env = {
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      AI_API_KEY:      process.env.AI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY:  process.env.OPENAI_API_KEY,
      GITHUB_TOKEN:    process.env.GITHUB_TOKEN,
      GITHUB_REPO:     process.env.GITHUB_REPO,
      GITHUB_BRANCH:   process.env.GITHUB_BRANCH || 'main',
      OLLAMA_URL:      process.env.OLLAMA_URL
    };

    const result = await runAgent(message, conversationId, env);
    res.json(result);
  } catch (e) {
    console.error('Agent error:', e);
    res.status(500).json({ error: e.message });
  }
}
