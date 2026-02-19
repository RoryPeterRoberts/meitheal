// ============================================================
// MEITHEAL SETUP ENDPOINT
// Called by setup.html to verify the database and seed config.
//
// Actions:
//   POST { action: 'check' }   — verify DB tables exist (proposals table)
//   POST { ...config }         — seed settings, create admin, send magic link
//
// The service key never passes through the browser.
// ============================================================

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
        error: `Could not save settings: ${t}. Make sure you have run the SQL migration in the Supabase SQL editor first.`
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
      // Non-fatal: settings and member were created. Log the warning.
      console.warn('Magic link send failed (non-fatal):', t);
    }

    return res.json({ ok: true });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
