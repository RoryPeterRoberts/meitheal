// ============================================================
// MEITHEAL LINK-AUTH ENDPOINT
// Called after magic link sign-in to link auth_id to member row.
// Must be server-side — client cannot update auth_id due to RLS.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  const anonKey     = process.env.SUPABASE_ANON_KEY;

  // Verify token and get user identity
  const userR = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${token}` }
  });
  if (!userR.ok) return res.status(401).json({ error: 'Invalid token' });
  const user = await userR.json();

  const sbHeaders = {
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type':  'application/json'
  };

  // Already linked?
  const linkedR = await fetch(`${supabaseUrl}/rest/v1/members?auth_id=eq.${user.id}&select=id,role`, {
    headers: sbHeaders
  });
  const linked = await linkedR.json();
  if (linked?.length) {
    return res.json({ role: linked[0].role });
  }

  // Find member by email
  const emailR = await fetch(`${supabaseUrl}/rest/v1/members?email=eq.${encodeURIComponent(user.email)}&select=id,role`, {
    headers: sbHeaders
  });
  const byEmail = await emailR.json();

  if (!byEmail?.length) {
    return res.status(404).json({
      error: 'No account found for this email. Contact your community admin to be added.'
    });
  }

  // Link auth_id to member row
  await fetch(`${supabaseUrl}/rest/v1/members?id=eq.${byEmail[0].id}`, {
    method:  'PATCH',
    headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
    body:    JSON.stringify({ auth_id: user.id })
  });

  return res.json({ role: byEmail[0].role });
}
