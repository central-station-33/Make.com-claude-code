/**
 * test-api-keys — RETIRED.
 *
 * This sent a real test email via Resend and pinged OpenAI/RapidAPI on
 * every call, completely unauthenticated. Found live during a security
 * review (2026-09-08): OpenAI and RapidAPI aren't used anywhere else in
 * this project (Claude via Anthropic is the only AI provider CLAUDE.md
 * documents), so this was leftover scaffolding from an earlier iteration,
 * left as a public cost/abuse vector (anyone hitting the URL burns Resend
 * email quota). There is no function-delete API available from this
 * session, so this is neutered in place rather than removed from the
 * project.
 */

Deno.serve(() =>
  new Response(JSON.stringify({ error: 'Retired: this was a diagnostic script, not production functionality.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  })
);
