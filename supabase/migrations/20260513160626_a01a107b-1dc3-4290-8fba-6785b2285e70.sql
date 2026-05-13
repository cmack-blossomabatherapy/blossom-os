insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Email assets are publicly readable" on storage.objects;
create policy "Email assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'email-assets');

drop policy if exists "Admins manage email assets" on storage.objects;
create policy "Admins manage email assets"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'email-assets' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'email-assets' and public.has_role(auth.uid(), 'admin'));