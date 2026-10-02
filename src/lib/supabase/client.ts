import { createClient, SupabaseClient } from '@supabase/supabase-js';
export type { User, Session, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_VALUE = import.meta.env.VITE_SUPABASE_URL || 'https://eiqiirskcukregwwqwla.supabase.co';
const SUPABASE_ANON_KEY_VALUE = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWlpcnNrY3VrcmVnd3dxd2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjA4MTEsImV4cCI6MjEwNjUzNjgxMX0.8hMw4vxEmST-woQpXuYKhbefkMSQstwBVoVo9eMd6-w';

export const SUPABASE_URL = SUPABASE_URL_VALUE;
export const SUPABASE_ANON_KEY = SUPABASE_ANON_KEY_VALUE;
export const isSupabaseConfigured = true;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL_VALUE, SUPABASE_ANON_KEY_VALUE, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export function getSupabaseCallbackUrl(): string {
  return `${SUPABASE_URL_VALUE}/auth/v1/callback`;
}

// No-op stub — credentials are now hardcoded; kept for import compatibility.
export function saveSupabaseCredentials(_url: string, _key: string): void {}
