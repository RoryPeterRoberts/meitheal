// ============================================================
// MEITHEAL — SUPABASE CLIENT
// Replace the values below with your project's URL and anon key,
// or configure them via environment variables in Vercel.
// ============================================================

const SUPABASE_URL      = window._SUPABASE_URL      || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = window._SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

let _sb = null;
function getSupabase() {
  if (!_sb) _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _sb;
}
