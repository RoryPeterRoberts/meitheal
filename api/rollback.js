// ============================================================
// MEITHEAL ROLLBACK
// Restores files to their pre-build state using stored SHA snapshots.
// For each file the agent wrote/deleted, we stored the GitHub blob SHA
// that existed before the build. Rollback fetches those blobs and
// re-commits them, triggering a new Vercel deploy.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const GITHUB_TOKEN         = process.env.GITHUB_TOKEN;
  const GITHUB_REPO          = process.env.GITHUB_REPO;
  const branch               = process.env.GITHUB_BRANCH || 'main';

  const sbHeaders = {
    'apikey':        SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type':  'application/json',
  };
  const ghHeaders = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept':        'application/vnd.github.v3+json',
    'Content-Type':  'application/json',
  };

  // Auth: verify Supabase token and check admin/steward role
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

  const { changelog_id } = req.body;
  if (!changelog_id) return res.status(400).json({ error: 'changelog_id required' });

  // Load changelog entry
  const clR = await fetch(
    `${SUPABASE_URL}/rest/v1/changelog?id=eq.${changelog_id}&select=*`,
    { headers: sbHeaders }
  );
  const cls = await clR.json();
  const cl  = cls[0];
  if (!cl) return res.status(404).json({ error: 'Changelog entry not found' });
  if (cl.rolled_back) return res.status(400).json({ error: 'This build has already been rolled back' });

  const snapshots = cl.rollback_snapshots;
  if (!snapshots || !snapshots.length) {
    return res.status(400).json({ error: 'No rollback data for this build (was it created before rollback support was added?)' });
  }

  // Helper: get current SHA of a file (null if not found)
  async function getCurrentSha(path) {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${branch}`,
      { headers: ghHeaders }
    );
    if (!r.ok) return null;
    const f = await r.json();
    return f.sha || null;
  }

  const results = [];

  for (const snap of snapshots) {
    try {
      if (snap.existed && snap.sha) {
        // File existed before build — restore it from its old blob
        const blobR = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/git/blobs/${snap.sha}`,
          { headers: ghHeaders }
        );
        if (!blobR.ok) {
          results.push({ path: snap.path, action: 'restore_failed', reason: `blob ${snap.sha} not found` });
          continue;
        }
        const blob    = await blobR.json();
        const curSha  = await getCurrentSha(snap.path);

        const putR = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${snap.path}`,
          {
            method:  'PUT',
            headers: ghHeaders,
            body:    JSON.stringify({
              message: `Rollback: restore ${snap.path}`,
              content: blob.content.replace(/\n/g, ''), // GitHub returns base64 with line breaks
              branch,
              ...(curSha ? { sha: curSha } : {})
            })
          }
        );
        if (!putR.ok) {
          const t = await putR.text();
          results.push({ path: snap.path, action: 'restore_failed', reason: t });
        } else {
          results.push({ path: snap.path, action: 'restored' });
        }

      } else if (!snap.existed) {
        // File was created by this build — delete it on rollback
        const curSha = await getCurrentSha(snap.path);
        if (!curSha) {
          results.push({ path: snap.path, action: 'skip', reason: 'file already gone' });
          continue;
        }
        const delR = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${snap.path}`,
          {
            method:  'DELETE',
            headers: ghHeaders,
            body:    JSON.stringify({
              message: `Rollback: remove ${snap.path}`,
              sha:     curSha,
              branch
            })
          }
        );
        if (!delR.ok) {
          const t = await delR.text();
          results.push({ path: snap.path, action: 'delete_failed', reason: t });
        } else {
          results.push({ path: snap.path, action: 'deleted' });
        }
      }
    } catch (e) {
      results.push({ path: snap.path, action: 'error', reason: e.message });
    }
  }

  // Mark changelog entry as rolled back
  await fetch(
    `${SUPABASE_URL}/rest/v1/changelog?id=eq.${changelog_id}`,
    {
      method:  'PATCH',
      headers: sbHeaders,
      body:    JSON.stringify({ rolled_back: true })
    }
  );

  const failed = results.filter(r => r.action.includes('failed') || r.action === 'error');
  res.json({
    ok:      failed.length === 0,
    results,
    message: failed.length === 0
      ? `Rolled back ${results.length} file(s). Deploying now (~30s).`
      : `Partial rollback — ${failed.length} file(s) failed. Check results.`
  });
}
