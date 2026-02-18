// ============================================================
// MEITHEAL INVITE ENDPOINT
// Admin-only endpoint to manage community members.
//
// Actions:
//   POST { action: 'list' }                        — list all members
//   POST { action: 'invite', email, display_name, role } — create + send magic link
//   POST { action: 'set_role', member_id, role }   — promote/demote (member ↔ steward)
//   POST { action: 'deactivate', member_id }        — set status=inactive
//
// All writes use the service key — anon client cannot INSERT members.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  const anonKey     = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  // Verify caller has a valid session
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userR = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': anonKey || serviceKey, 'Authorization': `Bearer ${token}` }
  });
  if (!userR.ok) return res.status(401).json({ error: 'Invalid session' });
  const { id: authUid } = await userR.json();

  // Check caller is admin or steward
  const sbHeaders = {
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type':  'application/json',
  };

  const callerR = await fetch(
    `${supabaseUrl}/rest/v1/members?auth_id=eq.${authUid}&select=id,role&limit=1`,
    { headers: sbHeaders }
  );
  const callerRows = await callerR.json();
  if (!callerRows?.length) return res.status(403).json({ error: 'Member not found' });
  const caller = callerRows[0];
  if (caller.role !== 'admin' && caller.role !== 'steward') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { action } = req.body;

  // ---- list ----
  if (action === 'list') {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/members?select=id,display_name,email,role,trust_level,status,created_at,auth_id&order=created_at.asc`,
      { headers: sbHeaders }
    );
    if (!r.ok) return res.status(500).json({ error: await r.text() });
    return res.json({ members: await r.json() });
  }

  // ---- invite ----
  if (action === 'invite') {
    const { email, display_name, role } = req.body;
    if (!email || !display_name) {
      return res.status(400).json({ error: 'email and display_name are required' });
    }
    if (role && !['member', 'steward'].includes(role)) {
      return res.status(400).json({ error: 'role must be member or steward' });
    }

    // Create member record (silently skip if email already exists)
    const createR = await fetch(`${supabaseUrl}/rest/v1/members`, {
      method:  'POST',
      headers: { ...sbHeaders, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({
        email,
        display_name,
        role:        role || 'member',
        trust_level: role === 'steward' ? 3 : 1,
        status:      'active',
      })
    });
    if (!createR.ok) {
      return res.status(500).json({ error: await createR.text() });
    }

    // Send magic link
    const origin = req.headers.origin
      || (req.headers.referer ? req.headers.referer.replace(/\/[^/]*$/, '') : '')
      || '';

    const otpR = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method:  'POST',
      headers: {
        'apikey':        anonKey || serviceKey,
        'Authorization': `Bearer ${anonKey || serviceKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        email,
        options: { emailRedirectTo: `${origin}/auth.html` }
      })
    });

    if (!otpR.ok) {
      const t = await otpR.text();
      console.warn('Magic link send failed (non-fatal):', t);
      return res.json({
        ok: true,
        warning: 'Member added but invite email failed. They can request a sign-in link from the sign-in page.'
      });
    }

    return res.json({ ok: true });
  }

  // ---- set_role ----
  if (action === 'set_role') {
    const { member_id, role } = req.body;
    if (!member_id || !role) {
      return res.status(400).json({ error: 'member_id and role are required' });
    }
    if (!['member', 'steward'].includes(role)) {
      return res.status(400).json({ error: 'role must be member or steward' });
    }

    const r = await fetch(`${supabaseUrl}/rest/v1/members?id=eq.${member_id}`, {
      method:  'PATCH',
      headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ role, trust_level: role === 'steward' ? 3 : 1 })
    });
    if (!r.ok) return res.status(500).json({ error: await r.text() });
    return res.json({ ok: true });
  }

  // ---- deactivate ----
  if (action === 'deactivate') {
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ error: 'member_id is required' });
    if (member_id === caller.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const r = await fetch(`${supabaseUrl}/rest/v1/members?id=eq.${member_id}`, {
      method:  'PATCH',
      headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'inactive' })
    });
    if (!r.ok) return res.status(500).json({ error: await r.text() });
    return res.json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
