/**
 * humanizeError — translate raw Supabase / Postgres errors into messages a
 * non-technical user can act on.
 *
 * We log the raw error to the console regardless (devs need it for triage)
 * but only return the friendlier string for UI. Unknown / unmapped errors
 * pass through unchanged so launch-week bugs are still legible.
 */

export type SupabaseLikeError = { message?: string; code?: string; details?: string } | null | undefined;

const FRIENDLY: Array<{ match: (msg: string, code?: string) => boolean; text: string }> = [
  // PostgREST / Postgres common cases
  { match: (m, c) => c === "23505" || /duplicate key|already exists/i.test(m), text: "This entry already exists." },
  { match: (m, c) => c === "23503" || /violates foreign key/i.test(m), text: "Can't complete this action — a related record is missing." },
  { match: (m, c) => c === "23502" || /null value in column/i.test(m), text: "Some required fields are missing." },
  { match: (m, c) => c === "23514" || /check constraint/i.test(m), text: "One or more values are outside the allowed range." },
  { match: (m) => /permission denied/i.test(m), text: "You don't have permission to do that." },
  { match: (m) => /JWT|invalid token|jwt expired/i.test(m), text: "Your session expired. Please sign in again." },
  { match: (m) => /network|failed to fetch/i.test(m), text: "Network problem — check your connection and try again." },
  { match: (m) => /row level security/i.test(m), text: "You don't have permission to do that." },
  { match: (m) => /storage.*Payload too large/i.test(m), text: "That file is too large." },
];

export function humanizeError(err: SupabaseLikeError, fallback?: string): string {
  if (!err) return fallback || "Something went wrong.";
  const msg = err.message || "";
  // Always log the raw error so we can debug from devtools — humanize is
  // only for what the user sees.
  // eslint-disable-next-line no-console
  console.error("[supabase error]", err);

  for (const rule of FRIENDLY) {
    if (rule.match(msg, err.code)) return rule.text;
  }
  // Unknown error → show the raw message so we get real signal during
  // launch. Truncate to keep the UI from breaking on a 5KB stack trace.
  if (msg.length > 240) return msg.slice(0, 240) + "…";
  return msg || fallback || "Something went wrong.";
}
