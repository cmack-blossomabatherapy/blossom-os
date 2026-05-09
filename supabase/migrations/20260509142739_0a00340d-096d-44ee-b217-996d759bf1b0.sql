
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_requests;
ALTER TABLE public.access_requests REPLICA IDENTITY FULL;
