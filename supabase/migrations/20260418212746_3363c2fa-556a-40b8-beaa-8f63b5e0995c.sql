-- ============================================================
-- 1. CURRENCIES + EXCHANGE RATES
-- ============================================================
CREATE TABLE public.currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.currencies (code, name, symbol, decimals) VALUES
  ('AOA', 'Kwanza Angolano', 'Kz', 2),
  ('USD', 'Dólar Americano', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('MZN', 'Metical Moçambicano', 'MT', 2),
  ('ZAR', 'Rand Sul-Africano', 'R', 2);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Currencies are viewable by authenticated users"
  ON public.currencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage currencies"
  ON public.currencies FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL REFERENCES public.currencies(code),
  to_currency TEXT NOT NULL REFERENCES public.currencies(code),
  rate NUMERIC(20, 8) NOT NULL CHECK (rate > 0),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency, effective_date)
);
CREATE INDEX idx_exchange_rates_lookup ON public.exchange_rates (from_currency, to_currency, effective_date DESC);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exchange rates are viewable by authenticated users"
  ON public.exchange_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage exchange rates"
  ON public.exchange_rates FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Seed default 1:1 rates for AOA base + sample rates
INSERT INTO public.exchange_rates (from_currency, to_currency, rate, source) VALUES
  ('USD', 'AOA', 920.00, 'seed'),
  ('EUR', 'AOA', 1010.00, 'seed'),
  ('MZN', 'AOA', 14.50, 'seed'),
  ('ZAR', 'AOA', 50.00, 'seed'),
  ('AOA', 'AOA', 1.00, 'seed'),
  ('USD', 'USD', 1.00, 'seed'),
  ('EUR', 'EUR', 1.00, 'seed');

-- Add base currency to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'AOA' REFERENCES public.currencies(code);

-- Add currency columns to financial tables
ALTER TABLE public.budget_entries
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AOA' REFERENCES public.currencies(code),
  ADD COLUMN IF NOT EXISTS exchange_rate_to_base NUMERIC(20, 8) NOT NULL DEFAULT 1;

ALTER TABLE public.disbursement_tranches
  ADD COLUMN IF NOT EXISTS exchange_rate_to_base NUMERIC(20, 8) NOT NULL DEFAULT 1;

ALTER TABLE public.funding_agreements
  ADD COLUMN IF NOT EXISTS exchange_rate_to_base NUMERIC(20, 8) NOT NULL DEFAULT 1;

-- ============================================================
-- 2. CAPACITY PLANNING + TIMESHEETS
-- ============================================================
CREATE TABLE public.user_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  weekly_hours NUMERIC(5, 2) NOT NULL DEFAULT 40 CHECK (weekly_hours >= 0 AND weekly_hours <= 168),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id, effective_from)
);
CREATE INDEX idx_user_capacity_user ON public.user_capacity (user_id, organization_id);

ALTER TABLE public.user_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own capacity or org admins view all"
  ON public.user_capacity FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Org admins manage capacity"
  ON public.user_capacity FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Users insert own capacity"
  ON public.user_capacity FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_user_capacity_updated_at
  BEFORE UPDATE ON public.user_capacity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  billable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_entries_user_date ON public.time_entries (user_id, entry_date DESC);
CREATE INDEX idx_time_entries_project ON public.time_entries (project_id, entry_date DESC);
CREATE INDEX idx_time_entries_task ON public.time_entries (task_id);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own time or org admins view all"
  ON public.time_entries FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(auth.uid(), organization_id));
CREATE POLICY "Users manage own time entries"
  ON public.time_entries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Users update own time entries"
  ON public.time_entries FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own time entries or org admins delete any"
  ON public.time_entries FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. EVM PREDICTIVE ALERTS
-- ============================================================
CREATE TABLE public.evm_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('cost_underperformance', 'schedule_underperformance', 'both')),
  cpi NUMERIC(6, 3),
  spi NUMERIC(6, 3),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evm_alerts_project ON public.evm_alerts (project_id, created_at DESC);
CREATE INDEX idx_evm_alerts_unack ON public.evm_alerts (is_acknowledged, created_at DESC) WHERE NOT is_acknowledged;

ALTER TABLE public.evm_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view EVM alerts of their projects"
  ON public.evm_alerts FOR SELECT TO authenticated
  USING (public.project_in_user_orgs(project_id));
CREATE POLICY "Org members acknowledge EVM alerts"
  ON public.evm_alerts FOR UPDATE TO authenticated
  USING (public.project_in_user_orgs(project_id))
  WITH CHECK (public.project_in_user_orgs(project_id));

-- Function to check EVM thresholds when project budget/spent/progress changes
CREATE OR REPLACE FUNCTION public.check_evm_thresholds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bac NUMERIC;
  v_ac NUMERIC;
  v_progress NUMERIC;
  v_pct_schedule NUMERIC;
  v_ev NUMERIC;
  v_pv NUMERIC;
  v_cpi NUMERIC;
  v_spi NUMERIC;
  v_alert_type TEXT;
  v_existing_id UUID;
  v_total_days NUMERIC;
  v_elapsed_days NUMERIC;
BEGIN
  v_bac := COALESCE(NEW.budget, 0);
  v_ac := COALESCE(NEW.spent, 0);
  v_progress := COALESCE(NEW.progress, 0);

  IF v_bac <= 0 OR NEW.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Schedule % (time elapsed)
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    v_total_days := GREATEST(EXTRACT(EPOCH FROM (NEW.end_date::timestamp - NEW.start_date::timestamp)) / 86400, 1);
    v_elapsed_days := GREATEST(EXTRACT(EPOCH FROM (now() - NEW.start_date::timestamp)) / 86400, 0);
    v_pct_schedule := LEAST(100, (v_elapsed_days / v_total_days) * 100);
  ELSE
    v_pct_schedule := 0;
  END IF;

  v_ev := v_bac * (v_progress / 100);
  v_pv := v_bac * (v_pct_schedule / 100);

  v_cpi := CASE WHEN v_ac > 0 THEN v_ev / v_ac ELSE 1 END;
  v_spi := CASE WHEN v_pv > 0 THEN v_ev / v_pv ELSE 1 END;

  IF v_cpi < 0.9 AND v_spi < 0.85 THEN
    v_alert_type := 'both';
  ELSIF v_cpi < 0.9 THEN
    v_alert_type := 'cost_underperformance';
  ELSIF v_spi < 0.85 THEN
    v_alert_type := 'schedule_underperformance';
  ELSE
    RETURN NEW;
  END IF;

  -- Avoid duplicate unacknowledged alert in last 7 days
  SELECT id INTO v_existing_id FROM public.evm_alerts
  WHERE project_id = NEW.id
    AND alert_type = v_alert_type
    AND is_acknowledged = false
    AND created_at > now() - interval '7 days'
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    INSERT INTO public.evm_alerts (project_id, alert_type, cpi, spi, severity, message)
    VALUES (
      NEW.id, v_alert_type, ROUND(v_cpi, 3), ROUND(v_spi, 3),
      CASE WHEN (v_cpi < 0.7 OR v_spi < 0.7) THEN 'critical' ELSE 'warning' END,
      'Projecto "' || NEW.name || '" com desempenho abaixo do limite (CPI=' || ROUND(v_cpi, 2) || ', SPI=' || ROUND(v_spi, 2) || ').'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_evm_after_project_update
  AFTER INSERT OR UPDATE OF budget, spent, progress, status, start_date, end_date
  ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.check_evm_thresholds();