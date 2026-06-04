import { createClient } from 'npm:@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const FROM_ADDRESS = 'Blossom OS <noreply@blossom.abacommandcenter.com>'
const BRAND = '#2BA8B0'
const BRAND_DARK = '#1F8A91'

function genCode() {
  const n = Math.floor(Math.random() * 1000000)
  return n.toString().padStart(6, '0')
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function emailHtml(code: string) {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.06);border:1px solid #e2e8f0;">
        <div style="background:${BRAND};background:linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});padding:28px 28px 22px;text-align:center;">
          <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.85);font-weight:600;">Blossom OS</div>
          <div style="margin-top:6px;font-size:20px;font-weight:700;color:#ffffff;">Your verification code</div>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 14px;font-size:14px;color:#334155;line-height:1.6;">Use the code below to finish signing in to Blossom OS. It expires in <strong>10 minutes</strong>.</p>
          <div style="margin:18px 0;padding:18px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
            <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:34px;letter-spacing:.45em;font-weight:700;color:${BRAND_DARK};">${code}</div>
          </div>
          <p style="margin:14px 0 0;font-size:12px;color:#64748b;line-height:1.6;">If you didn't request this code, you can safely ignore this email. For help, reply to this message or contact <a href="mailto:hr@blossomabatherapy.com" style="color:${BRAND};text-decoration:none;font-weight:600;">hr@blossomabatherapy.com</a>.</p>
        </div>
        <div style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">Blossom ABA Therapy · Secure access</div>
      </div>
    </div>
  </body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userRes, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const user = userRes.user
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')

    if (action === 'send') {
      const target = (body.email ?? user.email ?? '').toString().trim().toLowerCase()
      if (!target || !target.includes('@')) {
        return new Response(JSON.stringify({ error: 'invalid_email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      // Rate limit: at most 1 unused code in last 30s
      const since = new Date(Date.now() - 30_000).toISOString()
      const { count } = await admin.from('email_mfa_codes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since)
      if ((count ?? 0) > 0) {
        return new Response(JSON.stringify({ error: 'rate_limited', message: 'Please wait a moment before requesting another code.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const code = genCode()
      const code_hash = await sha256(code)
      const expires_at = new Date(Date.now() + 10 * 60_000).toISOString()
      const { error: insErr } = await admin.from('email_mfa_codes').insert({ user_id: user.id, email: target, code_hash, expires_at })
      if (insErr) {
        return new Response(JSON.stringify({ error: 'db_error', message: insErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: 'email_not_configured', message: 'Email sender is not configured.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const resp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [target],
          subject: `Your Blossom OS code: ${code}`,
          html: emailHtml(code),
        }),
      })
      const respBody = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: 'email_failed', message: (respBody as any)?.message ?? 'Failed to send email', details: respBody }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ ok: true, sentTo: target }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'verify') {
      const code = String(body.code ?? '').trim()
      const enroll = Boolean(body.enroll)
      if (!/^\d{6}$/.test(code)) {
        return new Response(JSON.stringify({ error: 'invalid_code_format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const code_hash = await sha256(code)
      const { data: rows, error: selErr } = await admin
        .from('email_mfa_codes')
        .select('id, email, expires_at, used_at, attempts')
        .eq('user_id', user.id)
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
      if (selErr) {
        return new Response(JSON.stringify({ error: 'db_error', message: selErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const row = rows?.[0]
      if (!row) {
        return new Response(JSON.stringify({ error: 'no_active_code', message: 'Request a new code.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: 'code_expired', message: 'That code expired — request a new one.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if ((row.attempts ?? 0) >= 5) {
        return new Response(JSON.stringify({ error: 'too_many_attempts', message: 'Too many attempts — request a new code.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      // Re-fetch matching hash
      const { data: match } = await admin
        .from('email_mfa_codes')
        .select('id, email')
        .eq('id', row.id)
        .eq('code_hash', code_hash)
        .maybeSingle()
      if (!match) {
        await admin.from('email_mfa_codes').update({ attempts: (row.attempts ?? 0) + 1 }).eq('id', row.id)
        return new Response(JSON.stringify({ error: 'invalid_code', message: 'That code is incorrect.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      await admin.from('email_mfa_codes').update({ used_at: new Date().toISOString() }).eq('id', row.id)
      if (enroll) {
        await admin.from('user_email_mfa').upsert({ user_id: user.id, email: match.email, enrolled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'internal', message: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})