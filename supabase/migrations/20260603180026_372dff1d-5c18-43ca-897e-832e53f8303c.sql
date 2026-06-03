ALTER TABLE public.referral_contacts
  ALTER COLUMN contact_owner TYPE text[]
  USING CASE
    WHEN contact_owner IS NULL OR btrim(contact_owner) = '' THEN NULL
    ELSE ARRAY[contact_owner]
  END;

ALTER TABLE public.referral_companies
  ALTER COLUMN relationship_owner TYPE text[]
  USING CASE
    WHEN relationship_owner IS NULL OR btrim(relationship_owner) = '' THEN NULL
    ELSE ARRAY[relationship_owner]
  END;