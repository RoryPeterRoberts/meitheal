// ============================================================
// MEITHEAL CONFIG BOOTSTRAP
// Serves public Supabase credentials as a JS snippet.
// Loaded as the first <script> on every page so window._SUPABASE_URL
// and window._SUPABASE_ANON_KEY are set before supabase.js runs.
// ============================================================

export default function handler(req, res) {
  const url  = process.env.SUPABASE_URL     || '';
  const anon = process.env.SUPABASE_ANON_KEY || '';

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(`window._SUPABASE_URL="${url}";window._SUPABASE_ANON_KEY="${anon}";`);
}
