
REVOKE EXECUTE ON FUNCTION public.canonical_report_totals(date,date,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.canonical_report_client_hours(date,date,text,int,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.canonical_report_provider_hours(date,date,text,boolean,int,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.canonical_report_billing_rows(date,date,text,text,text,text[],text[],int,int) FROM PUBLIC;
