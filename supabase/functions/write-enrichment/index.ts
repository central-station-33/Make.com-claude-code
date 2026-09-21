/**
 * write-enrichment — writes a model-produced enrichment JSON to a single
 * isa_leads row. Companion to list-pending-enrichment: Make fetches pending
 * leads from that endpoint, runs each prompt through its Gemini AI connection,
 * then posts the raw response text here to be parsed, clamped, and written —
 * the exact same validation enrich-leads applies to Claude's output, so a
 * lead reads identically to an ISA no matter which model produced it.
 *
 * POST body (form-encoded or JSON — form-encoded is what Make's HTTP
 * module should send, since Make handles escaping arbitrary model output
 * safely there instead of hand-building a JSON string that free text with
 * quotes/newlines would corrupt):
 *   lead_id: string, ai_model: string, raw_text: string,
 *   input_tokens?: number, output_tokens?: number
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const ENRICH_PROMPT_VERSION = '2026-09-12.structured-v1';
const ROUTINGS = new Set(['hot', 'warm', 'nurture', 'cold']);

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const clampInt = (v: unknown, min: number, max: number): number | null => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
};

function parseModelJson(raw: string): Record<string, unknown> {
  const stripped = String(raw ?? '').replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model response');
  return JSON.parse(stripped.slice(start, end + 1));
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const contentType = req.headers.get('content-type') ?? '';
  let body: Record<string, unknown> = {};
  if (contentType.includes('application/json')) {
    body = await req.json().catch(() => ({}));
  } else {
    // application/x-www-form-urlencoded or multipart/form-data — Make's HTTP
    // module encodes each field independently here, so arbitrary model text
    // (quotes, newlines, backslashes) survives without any manual escaping.
    const form = await req.formData().catch(() => null);
    if (form) for (const [k, v] of form.entries()) body[k] = String(v);
  }

  const leadId = String(body.lead_id ?? '').trim();
  const aiModel = String(body.ai_model ?? 'unknown-model').trim();
  const rawText = String(body.raw_text ?? '');
  const inputTokens = Number(body.input_tokens) || 0;
  const outputTokens = Number(body.output_tokens) || 0;

  const supabase = getServiceClient();

  if (!leadId) return json({ success: false, error: 'lead_id is required' }, 400);

  let result: Record<string, unknown>;
  try {
    result = parseModelJson(rawText);
  } catch (e) {
    return json({ success: false, error: `parse failed: ${(e as Error).message}` }, 422);
  }

  try {
    const bant = result.bant as Record<string, unknown> | undefined;
    const budget    = clampInt(bant?.budget    ?? result.bant_budget,    0, 3);
    const authority = clampInt(bant?.authority ?? result.bant_authority, 0, 3);
    const need      = clampInt(bant?.need      ?? result.bant_need,      0, 3);
    const timing    = clampInt(bant?.timing    ?? result.bant_timing,    0, 3);

    const components = [budget, authority, need, timing];
    const bantScore = components.every((c) => c !== null)
      ? components.reduce((a, c) => a + (c as number), 0)
      : clampInt(result.bant_score, 0, 12);

    const routing = typeof result.routing === 'string' && ROUTINGS.has(result.routing)
      ? result.routing
      : null;

    const nowIso = new Date().toISOString();

    const { data: updatedRows, error: updateError } = await supabase.from('isa_leads').update({
      ai_summary:           result.ai_summary ?? null,
      ai_investment_thesis: result.ai_investment_thesis ?? null,
      ai_contact_strategy:  result.ai_contact_strategy ?? null,
      isa_talking_points:   Array.isArray(result.isa_talking_points) ? result.isa_talking_points : [],
      ai_risk_flags:        Array.isArray(result.ai_risk_flags) ? result.ai_risk_flags : [],
      ai_bant_budget:       budget,
      ai_bant_authority:    authority,
      ai_bant_need:         need,
      ai_bant_timing:       timing,
      bant_score:           bantScore,
      motivation_score:     clampInt(result.motivation_score, 1, 5),
      ai_confidence:        clampInt(result.ai_confidence, 1, 5),
      ...(routing ? { routing } : {}),
      ai_model:             aiModel,
      ai_prompt_version:    ENRICH_PROMPT_VERSION,
      ai_enriched_at:       nowIso,
      ai_input_tokens:      inputTokens,
      ai_output_tokens:     outputTokens,
      updated_at:           nowIso,
    }).eq('id', leadId).select('id');

    if (updateError) throw new Error(updateError.message);
    // Postgrest does not error on a zero-row match, so a plain "no error" is not
    // proof the write landed. Check the returned row count explicitly.
    if (!updatedRows || updatedRows.length === 0) {
      return json({ success: false, error: `no isa_leads row matched id ${leadId}` }, 404);
    }

    return json({ success: true, data: { lead_id: leadId, ai_model: aiModel } });
  } catch (e) {
    const msg = (e as Error).message;
    return json({ success: false, error: msg }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
