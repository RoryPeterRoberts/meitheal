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

// ---- Feedback ----

async function createFeedbackRecord({ author_id, type, message }) {
  const { data, error } = await getSupabase()
    .from('feedback')
    .insert([{ author_id, type, message }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getMyFeedback(memberId) {
  const { data, error } = await getSupabase()
    .from('feedback')
    .select('*')
    .eq('author_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getAllFeedback() {
  const { data, error } = await getSupabase()
    .from('feedback')
    .select('*, members(display_name, email)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function updateFeedback(id, updates) {
  const { data, error } = await getSupabase()
    .from('feedback')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Proposals ----

async function createProposal({ feedback_id, title, description, promoted_by }) {
  const { data, error } = await getSupabase()
    .from('proposals')
    .insert([{ feedback_id, title, description, promoted_by, status: 'proposed' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getAllProposals() {
  const { data, error } = await getSupabase()
    .from('proposals')
    .select('*, members!proposals_promoted_by_fkey(display_name), feedback(message, ref_number, author_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getProposal(id) {
  const { data, error } = await getSupabase()
    .from('proposals')
    .select('*, feedback(message, ref_number, author_id)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ---- Settings ----

async function getSetting(key) {
  const { data } = await getSupabase()
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || null;
}

async function getCommunityName() {
  return await getSetting('community_name') || 'Our Community';
}
