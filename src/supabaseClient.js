import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co' || supabasePublishableKey === 'placeholder') {
  console.error('กรุณาตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ในไฟล์ .env');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storageKey: 'capyf-auth-v2',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
