import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    message: 'Vercel functions working',
    timestamp: new Date().toISOString(),
    env: {
      hasVapidPublic: !!process.env.VAPID_PUBLIC_KEY,
      hasVapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
      hasWebhookSecret: !!process.env.PUSH_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}
