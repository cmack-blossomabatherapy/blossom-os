
insert into storage.buckets (id, name, public) values ('journey-resources', 'journey-resources', true)
on conflict (id) do nothing;

create policy "Public read journey-resources"
on storage.objects for select
using (bucket_id = 'journey-resources');

create policy "Authenticated upload journey-resources"
on storage.objects for insert
to authenticated
with check (bucket_id = 'journey-resources');

create policy "Authenticated update journey-resources"
on storage.objects for update
to authenticated
using (bucket_id = 'journey-resources');

create policy "Authenticated delete journey-resources"
on storage.objects for delete
to authenticated
using (bucket_id = 'journey-resources');
