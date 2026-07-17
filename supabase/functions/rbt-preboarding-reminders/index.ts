import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find items overdue or due within 24h that haven't been reminded in the last 24h
  const { data: items, error } = await supabase
    .from('rbt_preboarding_items')
    .select('id, employee_id, requirement_key, owner_role, assigned_to, due_at, last_reminded_at, status')
    .lte('due_at', soon.toISOString())
    .not('status', 'in', '(approved,complete,waived)');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const toRemind = (items ?? []).filter((i: any) => !i.last_reminded_at || i.last_reminded_at < dayAgo);

  // Load requirement labels
  const keys = [...new Set(toRemind.map((i: any) => i.requirement_key))];
  const { data: reqs } = await supabase.from('rbt_preboarding_requirements')
    .select('key,label').in('key', keys.length ? keys : ['__none__']);
  const labelByKey = new Map((reqs ?? []).map((r: any) => [r.key, r.label]));

  let notified = 0;
  for (const item of toRemind as any[]) {
    const overdue = new Date(item.due_at) < now;
    const label = labelByKey.get(item.requirement_key) ?? item.requirement_key;

    // Notify the OWNER — the employee if they own it, otherwise the assigned internal user
    const recipient = item.owner_role === 'rbt' ? item.employee_id : item.assigned_to;
    if (recipient) {
      await supabase.from('user_notifications').insert({
        user_id: recipient,
        kind: 'preboarding',
        title: overdue ? `Overdue: ${label}` : `Due soon: ${label}`,
        body: overdue
          ? 'This preboarding step is past due. Please complete it as soon as possible.'
          : 'This preboarding step is due within 24 hours.',
        link: item.owner_role === 'rbt' ? '/rbt/app/preboarding' : `/admin/rbt-preboarding`,
        dedupe_key: `preboarding:${item.id}:${overdue ? 'overdue' : 'soon'}:${now.toISOString().slice(0,10)}`,
      });
      notified++;
    }

    await supabase.from('rbt_preboarding_items')
      .update({ last_reminded_at: now.toISOString() })
      .eq('id', item.id);
  }

  return new Response(JSON.stringify({ checked: items?.length ?? 0, notified }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});