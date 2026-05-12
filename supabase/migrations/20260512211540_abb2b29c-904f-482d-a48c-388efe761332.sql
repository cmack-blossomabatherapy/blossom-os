
insert into storage.buckets (id, name, public)
values ('bcba-imports', 'bcba-imports', false)
on conflict (id) do nothing;

create policy "admins read bcba imports"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bcba-imports' and public.has_role(auth.uid(), 'admin'));

create policy "admins upload bcba imports"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bcba-imports' and public.has_role(auth.uid(), 'admin'));

create policy "admins delete bcba imports"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bcba-imports' and public.has_role(auth.uid(), 'admin'));
