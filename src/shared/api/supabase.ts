import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabaseTypes';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env) || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://evqksvsoxjeoauprzojt.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWtzdnNveGplb2F1cHJ6b2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDQ0MTMsImV4cCI6MjEwMzkyMDQxM30.kPWAvwW0Rm6fB4b5MFvsGet6y9evtGju1tWMzqiDIbg';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
