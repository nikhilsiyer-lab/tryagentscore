import { createBrowserClient } from '@supabase/ssr'

// Automatically detect and correct swapped Supabase environment variables on Vercel
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (envUrl.startsWith('ey') && envKey.startsWith('http')) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = envKey;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = envUrl;
}

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (url.startsWith('ey') && key.startsWith('http')) {
    const temp = url;
    url = key;
    key = temp;
  }

  return createBrowserClient(
    url,
    key
  )
}
