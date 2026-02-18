// ============================================================
// MEITHEAL MEMORY
// GET  /api/memory — returns AGENT.md content
// POST /api/memory — saves updated AGENT.md content
// Admin/steward only.
// ============================================================

export default async function handler(req, res) {
  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const GITHUB_TOKEN         = process.env.GITHUB_TOKEN;
  const GITHUB_REPO          = process.env.GITHUB_REPO;
  const branch               = process.env.GITHUB_BRANCH || 'main';

  const ghHeaders = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept':        'application/vnd.github.v3+json',
    'Content-Type':  'application/json',
  };

  // Auth: verify Supabase token
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No auth token' });

  const userR = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': process.env.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!userR.ok) return res.status(401).json({ error: 'Invalid token' });
  const user = await userR.json();

  const memberR = await fetch(
    `${SUPABASE_URL}/rest/v1/members?auth_id=eq.${user.id}&select=id,role`,
    { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  const members = await memberR.json();
  const member  = members[0];
  if (!member || (member.role !== 'admin' && member.role !== 'steward')) {
    return res.status(403).json({ error: 'Admin or steward access required' });
  }

  const fileUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/AGENT.md?ref=${branch}`;

  if (req.method === 'GET') {
    const r = await fetch(fileUrl, { headers: ghHeaders });
    if (!r.ok) return res.status(404).json({ error: 'AGENT.md not found' });
    const f = await r.json();
    const content = Buffer.from(f.content, 'base64').toString('utf-8');
    return res.json({ content, sha: f.sha });
  }

  if (req.method === 'POST') {
    const { content } = req.body;
    if (typeof content !== 'string') return res.status(400).json({ error: 'content required' });

    // Get current SHA
    const curR = await fetch(fileUrl, { headers: ghHeaders });
    const sha   = curR.ok ? (await curR.json()).sha : undefined;

    const putR = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/AGENT.md`,
      {
        method:  'PUT',
        headers: ghHeaders,
        body:    JSON.stringify({
          message: 'Update agent memory (admin edit)',
          content: Buffer.from(content).toString('base64'),
          branch,
          ...(sha ? { sha } : {})
        })
      }
    );
    if (!putR.ok) { const t = await putR.text(); return res.status(500).json({ error: t }); }
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'GET or POST only' });
}
