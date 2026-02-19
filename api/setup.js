// ============================================================
// MEITHEAL SETUP ENDPOINT
// Called by setup.html to verify the database and seed config.
//
// Actions:
//   POST { action: 'check' }          — verify DB tables exist
//   POST { action: 'migrate', sql }   — run migrations via Supabase Management API
//   POST { ...config }                — seed settings, create admin, send magic link
//
// The service key never passes through the browser.
// ============================================================

// Split SQL into individual statements, respecting $$ dollar-quoting blocks.
// This handles PL/pgSQL functions whose bodies contain semicolons.
function splitStatements(sql) {
  sql = sql.replace(/--[^\n]*/g, ''); // strip line comments
  const stmts = [];
  let current = '';
  let i = 0;
  while (i < sql.length) {
    if (sql.slice(i, i + 2) === '$$') {
      const end = sql.indexOf('$$', i + 2);
      if (end !== -1) {
        current += sql.slice(i, end + 2);
        i = end + 2;
        continue;
      }
    }
    if (sql[i] === ';') {
      const trimmed = current.trim();
      if (trimmed) stmts.push(trimmed);
      current = '';
    } else {
      current += sql[i];
    }
    i++;
  }
  const trimmed = current.trim();
  if (trimmed) stmts.push(trimmed);
  return stmts.filter(s => s.length > 0);
}

// Run one SQL statement via the Supabase Management API.
// Requires a Personal Access Token (SUPABASE_ACCESS_TOKEN env var).
async function runMgmtSql(sql, projectRef, accessToken) {
  try {
    const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!r.ok) {
      const text = await r.text();
      return { error: text };
    }
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  const anonKey     = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: 'Server not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel environment variables, then redeploy.'
    });
  }

  const sbHeaders = {
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type':  'application/json',
    'Prefer':        'resolution=merge-duplicates,return=minimal',
  };

  const { action } = req.body;

  // ---- Migrate: run all migrations via Supabase Management API ----
  if (action === 'migrate') {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    const projectRef  = (supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/) || [])[1];

    if (!accessToken) {
      // Signal to the client to fall back to manual SQL mode
      return res.status(200).json({ ok: false, fallback: true, reason: 'SUPABASE_ACCESS_TOKEN not configured' });
    }
    if (!projectRef) {
      return res.status(400).json({ error: 'Could not extract project ref from SUPABASE_URL.' });
    }

    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'No SQL provided.' });

    const statements = splitStatements(sql);
    let ran = 0, skipped = 0;

    for (const stmt of statements) {
      // For CREATE POLICY, drop first to ensure idempotency
      const policyMatch = stmt.match(/CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(\w+)/i);
      if (policyMatch) {
        const [, policyName, tableName] = policyMatch;
        await runMgmtSql(`DROP POLICY IF EXISTS "${policyName}" ON ${tableName}`, projectRef, accessToken);
      }

      const result = await runMgmtSql(stmt, projectRef, accessToken);

      if (result && result.error) {
        const errLower = (result.error || '').toLowerCase();
        // Skip harmless "already exists" errors
        if (errLower.includes('already exists') || errLower.includes('duplicate')) {
          skipped++;
          continue;
        }
        return res.status(400).json({
          error: `Migration failed: ${result.error}\n\nStatement: ${stmt.slice(0, 150)}`
        });
      }
      ran++;
    }

    return res.json({ ok: true, ran, skipped });
  }

  // ---- Check: verify DB tables exist ----
  if (action === 'check') {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/proposals?limit=1`, {
        headers: {
          'apikey':        serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        }
      });
      if (!r.ok) {
        const t = await r.text();
        return res.status(400).json({ error: `Database not ready: ${t}` });
      }
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ---- Setup: seed settings, create admin, send magic link ----
  const { communityName, provider, model, apiKey, ollamaUrl, adminEmail, adminName, siteUrl, communityCharter } = req.body;

  const origin = siteUrl
    || req.headers.origin
    || (req.headers.referer ? req.headers.referer.replace(/\/[^/]*$/, '') : '')
    || '';

  try {
    // 1. Upsert community settings
    const settingsR = await fetch(`${supabaseUrl}/rest/v1/settings`, {
      method:  'POST',
      headers: sbHeaders,
      body: JSON.stringify([
        { key: 'community_name',    value: communityName    || 'My Community'       },
        { key: 'community_charter', value: communityCharter || ''                   },
        { key: 'ai_provider',       value: provider         || 'anthropic'          },
        { key: 'ai_model',          value: model            || 'claude-sonnet-4-6'  },
        { key: 'ai_api_key',        value: apiKey           || ''                   },
        { key: 'ollama_url',        value: ollamaUrl        || ''                   },
        { key: 'site_url',          value: origin                                   },
        { key: 'initialized',       value: 'true'                                   },
        { key: 'steward_enabled',   value: 'true'                                   },
        { key: 'voting_enabled',    value: 'true'                                   },
      ])
    });

    if (!settingsR.ok) {
      const t = await settingsR.text();
      return res.status(500).json({
        error: `Could not save settings: ${t}. Make sure the database migrations have been run first.`
      });
    }

    // 2. Create admin member record
    await fetch(`${supabaseUrl}/rest/v1/members`, {
      method:  'POST',
      headers: { ...sbHeaders, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({
        email:        adminEmail,
        display_name: adminName,
        role:         'admin',
        trust_level:  4,
        status:       'active',
      })
    });

    // 3. Send magic link to admin email
    const otpR = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method:  'POST',
      headers: {
        'apikey':        anonKey || serviceKey,
        'Authorization': `Bearer ${anonKey || serviceKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        email: adminEmail,
        options: { emailRedirectTo: `${origin}/auth.html` }
      })
    });

    if (!otpR.ok) {
      const t = await otpR.text();
      console.warn('Magic link send failed (non-fatal):', t);
    }

    return res.json({ ok: true });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
