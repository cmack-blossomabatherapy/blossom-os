ALTER TABLE public.phone_ai_calls REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.phone_ai_calls;