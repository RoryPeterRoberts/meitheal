// ============================================================
// MEITHEAL SETUP ENDPOINT
// Called by setup.html after the user has run the SQL migration.
// Seeds community settings, creates admin member, sends magic link.
// Uses env vars — the secret key never passes through the browser.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { communityName, provider, model, apiKey, ollamaUrl, adminEmail, adminName } = req.body;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  const anonKey     = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: 'Server not configured. Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your Vercel environment variables.'
    });
  }

  const sbHeaders = {
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type':  'application/json',
    'Prefer':        'resolution=merge-duplicates,return=minimal'
  };

  try {
    // 1. Upsert community settings
    const settingsR = await fetch(`${supabaseUrl}/rest/v1/settings`, {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify([
        { key: 'community_name', value: communityName },
        { key: 'ai_provider',    value: provider },
        { key: 'ai_model',       value: model },
        { key: 'ai_api_key',     value: apiKey || '' },
        { key: 'ollama_url',     value: ollamaUrl || '' },
        { key: 'initialized',    value: 'true' }
      ])
    });

    if (!settingsR.ok) {
      const t = await settingsR.text();
      return res.status(500).json({
        error: `Database not ready: ${t}\n\nMake sure you've run the SQL migration in the Supabase SQL editor first.`
      });
    }

    // 2. Create admin member record (ignore if already exists)
    await fetch(`${supabaseUrl}/rest/v1/members`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({
        email:        adminEmail,
        display_name: adminName,
        role:         'admin',
        status:       'active'
      })
    });

    // 3. Send magic link
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || '';
    const otpR = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey':        anonKey || serviceKey,
        'Authorization': `Bearer ${anonKey || serviceKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        email: adminEmail,
        options: { emailRedirectTo: `${origin}/auth.html` }
      })
    });

    if (!otpR.ok) {
      const t = await otpR.text();
      console.warn('OTP send warning (non-fatal):', t);
    }

    res.json({ ok: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
