import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Fill these in from: Supabase Dashboard → Settings → API ──────
// SUPABASE_URL and SUPABASE_ANON_KEY are PUBLIC keys — safe for browser use.
// Security is enforced by RLS policies and the email whitelist trigger.
const SUPABASE_URL  = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON = "eyJYOUR_ANON_KEY_HERE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Auth Helpers ──────────────────────────────────────────────────

/** Sign in with Email/Password */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) throw error;
  return data;
}

/** Sign out */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.reload();
}

/**
 * Get the current session.
 * Returns { session, user, email } or null if not signed in.
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const user  = data.session.user;
  return { session: data.session, user, email: user.email };
}

/**
 * Verify the signed-in email is on the whitelist.
 * Uses the is_email_allowed() PostgreSQL function.
 */
export async function isEmailAllowed(email) {
  const { data, error } = await supabase.rpc("is_email_allowed", {
    check_email: email,
  });
  if (error) return false;
  return data === true;
}

/**
 * Full auth check — call this on every page load.
 * Returns the user object if allowed, or null.
 * Fires onAllowed(user) / onDenied(email) callbacks.
 */
export async function requireAuth({ onAllowed, onDenied, onUnauthenticated }) {
  const sess = await getSession();

  if (!sess) {
    onUnauthenticated?.();
    return null;
  }

  const allowed = await isEmailAllowed(sess.email);
  if (!allowed) {
    await signOut();
    onDenied?.(sess.email);
    return null;
  }

  onAllowed?.(sess.user);
  return sess.user;
}
