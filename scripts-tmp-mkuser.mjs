import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const email = 'testscheduling@blossomabatherapy.com';
const password = 'Blossom@123';
let { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (error && !String(error.message).toLowerCase().includes('already')) { console.error(error); process.exit(1); }
let userId = data?.user?.id;
if (!userId) {
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  userId = list.users.find(u => u.email === email)?.id;
}
console.log('user', userId);
await sb.from('profiles').upsert({ user_id: userId, email, display_name: 'Test Scheduling', department: 'Scheduling', dashboard_access: 'department', active: true }, { onConflict: 'user_id' });
const { error: rerr } = await sb.from('user_roles').upsert({ user_id: userId, role: 'scheduling' }, { onConflict: 'user_id,role' });
if (rerr) console.error(rerr);
console.log('done');
