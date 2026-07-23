
-- 1) Benefits Knowledge table (canonical payer guidance)
CREATE TABLE IF NOT EXISTS public.benefits_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  payer TEXT NOT NULL,
  insurance_category TEXT NOT NULL,
  intake_status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  monday_item_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.benefits_knowledge TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.benefits_knowledge TO authenticated;
GRANT ALL ON public.benefits_knowledge TO service_role;

ALTER TABLE public.benefits_knowledge ENABLE ROW LEVEL SECURITY;

-- Any authenticated role can read active guidance (needed for lead drawer + VOB).
CREATE POLICY "authenticated read active benefits knowledge"
  ON public.benefits_knowledge FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'systems_admin'));

-- Only admin-tier roles can write.
CREATE POLICY "admins insert benefits knowledge"
  ON public.benefits_knowledge FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'systems_admin'));

CREATE POLICY "admins update benefits knowledge"
  ON public.benefits_knowledge FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'systems_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'systems_admin'));

CREATE POLICY "admins delete benefits knowledge"
  ON public.benefits_knowledge FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'systems_admin'));

CREATE TRIGGER benefits_knowledge_updated_at
  BEFORE UPDATE ON public.benefits_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the canonical 48 rows (idempotent via monday_item_id).
INSERT INTO public.benefits_knowledge (state, payer, insurance_category, intake_status, notes, monday_item_id, is_active) VALUES
('Georgia','Amerigroup Real Solutions','MCO','TAKE','Check Active','12250880354',true),
('Georgia','Care Source','MCO','TAKE','Check Active','12250786311',true),
('Georgia','PeachState','MCO','TAKE','Check Active','12250869832',true),
('Georgia','UHC-Optum- UBH','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250919263',true),
('Georgia','Cigna','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250916439',true),
('Georgia','ChampVA','Misc','TAKE','','12250869992',true),
('Georgia','Kaiser','Misc','TAKE-CONDITIONAL','Only for bill denial','12250869953',true),
('Georgia','Aetna','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad- PUSH THROUGH','12250869981',true),
('Georgia','Anthem','OON Commercial','CONDITIONAL','Check plans below - Can be found on Card','12250909159',true),
('Georgia','HSA','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Bad','12250908877',true),
('Georgia','Credence','OON Commercial','TAKE','Push Through','12250922409',true),
('Georgia','National Benefits Fund','OON Commercial','TAKE','Push Through','12250922361',true),
('Georgia','Empire','OON Commercial','TAKE','Push Through','12250918440',true),
('Georgia','Anthem- No specific Plan','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250916964',true),
('Georgia','Anthem- Through a Corp...','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250909247',true),
('Tennessee','Well Point- Amerigroup','MCO','TAKE-CONDITIONAL','As long as insurance is active','12250787607',true),
('Tennessee','TennCare Blue Care','MCO','DON''T TAKE','','12250924302',true),
('Tennessee','United Health Care','MCO','DON''T TAKE','','12250899920',true),
('Tennessee','BCBS','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250923551',true),
('Tennessee','UHC','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250927315',true),
('Tennessee','ChampVA','Misc','TAKE','','12250923576',true),
('Tennessee','Aetna','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad- PUSH THROUGH','12250923561',true),
('Tennessee','Cigna','OON Commercial','DON''T TAKE','','12250937519',true),
('Virginia','Aetna Better Health','MCO','TAKE','Check Active','12250944008',true),
('Virginia','Anthem Healthkeepers','MCO','TAKE','Check Active','12250921735',true),
('Virginia','Setara Health Plans Medicaid','MCO','TAKE','Check Active','12250946565',true),
('Virginia','UHC Community','MCO','TAKE','Check Active','12250938058',true),
('Virginia','BCBS/ Anthem VA','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250946240',true),
('Virginia','Care First Blue Choice','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250956369',true),
('Virginia','Sentara','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250924958',true),
('Virginia','Aetna','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad- PUSH THROUGH','12250944290',true),
('Virginia','UHC','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250950237',true),
('Virginia','Cigna','OON Commercial','DON''T TAKE','Especially if benefits are bad','12250944300',true),
('North Carolina','Alliance - NC Medicaid','MCO','TAKE','','12250962541',true),
('North Carolina','Carolina Complete Health - NC Medicaid','MCO','TAKE','','12250925685',true),
('North Carolina','Healthy Blue - NC Medicaid','MCO','TAKE','','12250962293',true),
('North Carolina','Partners Behavioral Health Management - NC Medicaid','MCO','TAKE','','12250962298',true),
('North Carolina','Trillium Health Resources','MCO','TAKE','','12250947274',true),
('North Carolina','Vaya Health','MCO','TAKE','','12250925179',true),
('North Carolina','BCBS','INN Commercials','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250962781',true),
('North Carolina','ChampVA','Misc','TAKE','','12250925857',true),
('North Carolina','Aetna','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad- PUSH THROUGH IF UCR','12250957292',true),
('North Carolina','United Behavioral Health','OON Commercial','TAKE-CONDITIONAL','Does not seem to pay well','12250962835',true),
('North Carolina','UMR','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad- PUSH THROUGH','12250947193',true),
('North Carolina','Vaya Health','OON Commercial','TAKE-CONDITIONAL','Does not seem to pay well','12250947821',true),
('North Carolina','Cigna','OON Commercial','TAKE-CONDITIONAL','Unless Benefits are Very Bad','12250947867',true),
('Maryland','-','MCO','TAKE','Take All','12250963311',true),
('Maryland','-','OON Commercial','TAKE-CONDITIONAL','Take All unless extremely bad benefits','12250970422',true)
ON CONFLICT DO NOTHING;

-- 2) Extend email_templates to support intake template records (SMS/email, stage, use case, team, merge fields, active).
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stage TEXT,
  ADD COLUMN IF NOT EXISTS use_case TEXT,
  ADD COLUMN IF NOT EXISTS team TEXT,
  ADD COLUMN IF NOT EXISTS merge_fields JSONB NOT NULL DEFAULT '[]'::jsonb;
