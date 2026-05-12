
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journey-videos', 'journey-videos', true, 524288000, array['video/mp4','video/webm','video/quicktime','video/ogg','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read journey videos"
on storage.objects for select
using (bucket_id = 'journey-videos');

create policy "Admins upload journey videos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'journey-videos' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update journey videos"
on storage.objects for update
to authenticated
using (bucket_id = 'journey-videos' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete journey videos"
on storage.objects for delete
to authenticated
using (bucket_id = 'journey-videos' and public.has_role(auth.uid(), 'admin'));
