/* Supabase browser client bootstrap.
 * The publishable key is intended for frontend use. Database security must be
 * enforced with Supabase Auth and Row Level Security (RLS), never with this key.
 */
(() => {
  const SUPABASE_URL = 'https://jvaxxicoembvdykvdcxy.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_glL-5ANOFw9SiL79980t1A_OyaYVJJv';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[Supabase] Supabase JS library did not load.');
    window.supabaseReady = Promise.resolve({ ok: false, reason: 'library_missing' });
    return;
  }

  try {
    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    // This confirms client initialization only; it does not yet verify database
    // permissions or connectivity to any application table.
    window.supabaseReady = Promise.resolve({ ok: true });
    console.info('[Supabase] Client initialized. RLS and application data access still need verification.');
  } catch (error) {
    console.error('[Supabase] Client initialization failed:', error);
    window.supabaseReady = Promise.resolve({ ok: false, reason: 'initialization_failed' });
  }
})();
