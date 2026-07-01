ALTER TABLE public.referral_contacts
  ALTER COLUMN number_of_sales_activities DROP NOT NULL,
  ALTER COLUMN number_of_referrals_sent DROP NOT NULL,
  ALTER COLUMN number_of_times_contacted DROP NOT NULL;