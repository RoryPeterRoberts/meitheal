// ============================================================
// BUILDMYSITE — Image Upload Handler
// Accepts image uploads (logo, hero), stores in Vercel Blob,
// returns the public URL.
// ============================================================

import { put } from '@vercel/blob';

// Rate limiting
const uploads = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 300_000; // 5 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const record = uploads.get(ip);
  if (!record || now - record.firstAt > RATE_WINDOW) {
    uploads.set(ip, { count: 1, firstAt: now });
    return false;
  }
  record.count++;
  return record.count > RATE_LIMIT;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many uploads. Please wait a few minutes.' });
  }

  // Auth check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check Blob token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Image storage not configured',
      hint: 'Set BLOB_READ_WRITE_TOKEN in your Vercel project settings.'
    });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    // Expect raw body with content-type header
    if (!ALLOWED_TYPES.includes(contentType.split(';')[0])) {
      return res.status(400).json({
        error: `Invalid file type: ${contentType}. Allowed: ${ALLOWED_TYPES.join(', ')}`
      });
    }

    // Get filename from query param or header
    const filename = req.query.filename || req.headers['x-filename'] || `upload-${Date.now()}`;

    // Read body as buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    if (body.length > MAX_SIZE) {
      return res.status(400).json({ error: `File too large: ${(body.length / 1024 / 1024).toFixed(1)}MB (max 5MB)` });
    }

    if (body.length === 0) {
      return res.status(400).json({ error: 'Empty file' });
    }

    // Upload to Vercel Blob
    const blob = await put(filename, body, {
      access: 'public',
      contentType: contentType.split(';')[0],
    });

    return res.status(200).json({
      url: blob.url,
      size: body.length,
      filename,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({
      error: 'Upload failed',
      hint: err.message
    });
  }
}
