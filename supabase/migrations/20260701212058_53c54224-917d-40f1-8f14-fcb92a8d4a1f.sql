UPDATE public.referral_contacts
SET
  number_of_sales_activities = COALESCE(number_of_sales_activities, 0),
  number_of_referrals_sent = COALESCE(number_of_referrals_sent, 0),
  number_of_times_contacted = COALESCE(number_of_times_contacted, 0);

ALTER TABLE public.referral_contacts
  ALTER COLUMN number_of_sales_activities SET DEFAULT 0,
  ALTER COLUMN number_of_referrals_sent SET DEFAULT 0,
  ALTER COLUMN number_of_times_contacted SET DEFAULT 0,
  ALTER COLUMN number_of_sales_activities DROP NOT NULL,
  ALTER COLUMN number_of_referrals_sent DROP NOT NULL,
  ALTER COLUMN number_of_times_contacted DROP NOT NULL;