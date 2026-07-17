// Retell AI webhook handler. Signature verification is OPTIONAL.
// If RETELL_WEBHOOK_SECRET is set, requests are HMAC-SHA256 verified.
// If not set, requests are accepted and stored with verification_status='unverified'.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { classifyAfterHoursCall } from '../_shared/classifyAfterHoursCall.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-retell-signature, retell-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET = Deno.env.get('RETELL_WEBHOOK_SECRET') ?? ''

async function verifySignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return signature === hex || signature === `sha256=${hex}` || signature.toLowerCase() === hex
}

function pickAnalysis(call: any) {
  const a = call?.call_analysis ?? {}
  const custom = a?.custom_analysis_data ?? {}
  return {
    summary: a?.call_summary ?? null,
    sentiment: a?.user_sentiment ?? null,
    outcome: a?.call_successful != null ? (a.call_successful ? 'successful' : 'unsuccessful') : null,
    custom,
  }
}

function classifyDepartment(reason: string, custom: any): string {
  return classifyAfterHoursCall(reason, custom)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const raw = await req.text()
    const sigHeader = req.headers.get('x-retell-signature') ?? req.headers.get('retell-signature')

    let verification_status = 'unverified'
    if (WEBHOOK_SECRET) {
      const ok = await verifySignature(raw, sigHeader, WEBHOOK_SECRET)
      if (!ok) {
        console.warn('[retell-webhook] signature mismatch')
        return new Response(JSON.stringify({ error: 'invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      verification_status = 'verified'
    } else {
      console.log('[retell-webhook] RETELL_WEBHOOK_SECRET not configured — accepting unverified')
    }

    const payload = JSON.parse(raw)
    const event = payload?.event ?? payload?.type
    const call = payload?.call ?? payload?.data ?? payload
    const retell_call_id = call?.call_id ?? call?.id

    console.log('[retell-webhook] event=%s call_id=%s verified=%s', event, retell_call_id, verification_status)

    if (!retell_call_id) {
      return new Response(JSON.stringify({ error: 'missing call_id', event }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
    const { summary, sentiment, outcome, custom } = pickAnalysis(call)
    const reason = custom?.reason_for_call ?? null
    const department = classifyDepartment(reason, custom)

    const row = {
      retell_call_id,
      agent_id: call?.agent_id ?? null,
      call_status: call?.call_status ?? event ?? null,
      caller_name: custom?.caller_name ?? null,
      caller_type: custom?.caller_type ?? null,
      phone_number: call?.from_number ?? call?.from ?? null,
      preferred_callback_time: custom?.preferred_callback_time ?? null,
      state: custom?.state ?? null,
      child_age: custom?.child_age ?? null,
      insurance_provider: custom?.insurance_provider ?? null,
      insurance_type: custom?.insurance_type ?? null,
      reason_for_call: reason,
      call_summary: summary,
      urgency_level: custom?.urgency_level ?? null,
      sentiment,
      caller_emotion: custom?.caller_emotion ?? null,
      call_outcome: outcome,
      needs_intake_follow_up: custom?.needs_intake_follow_up ?? true,
      emergency_flag: custom?.emergency_flag ?? false,
      department_to_notify: department,
      handling_instructions: custom?.handling_instructions ?? null,
      recording_url: call?.recording_url ?? null,
      transcript: call?.transcript ?? null,
      transcript_object: call?.transcript_object ?? null,
      custom_analysis_data: custom,
      raw_retell_payload: payload,
      source: 'webhook',
      verification_status,
      call_started_at: call?.start_timestamp ? new Date(call.start_timestamp).toISOString() : null,
      call_ended_at: call?.end_timestamp ? new Date(call.end_timestamp).toISOString() : null,
      duration_seconds: call?.duration_ms ? Math.round(call.duration_ms / 1000) : null,
    }

    const { error } = await supabase
      .from('phone_ai_calls')
      .upsert(row, { onConflict: 'retell_call_id' })

    if (error) {
      console.error('[retell-webhook] db error', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Auto email notifications are intentionally disabled while we validate the
    // AI classification. Intake sends manually from the After-Hours board for now.

    return new Response(JSON.stringify({ ok: true, retell_call_id, verification_status }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[retell-webhook] error', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})