
CREATE OR REPLACE FUNCTION public.validate_plan_downgrade(_org_id uuid, _new_plan_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_plan RECORD;
  v_project_count INTEGER;
  v_member_count INTEGER;
  v_portfolio_count INTEGER;
  v_conflicts jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_plan FROM subscription_plans WHERE id = _new_plan_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'conflicts', jsonb_build_array('Plano não encontrado'));
  END IF;

  SELECT COUNT(*) INTO v_project_count FROM projects WHERE organization_id = _org_id;
  SELECT COUNT(*) INTO v_member_count FROM organization_members WHERE organization_id = _org_id;
  SELECT COUNT(*) INTO v_portfolio_count FROM portfolios WHERE organization_id = _org_id;

  IF v_plan.max_projects != -1 AND v_project_count > v_plan.max_projects THEN
    v_conflicts := v_conflicts || jsonb_build_array('Tem ' || v_project_count || ' projectos activos mas o plano permite apenas ' || v_plan.max_projects);
  END IF;

  IF v_plan.max_members != -1 AND v_member_count > v_plan.max_members THEN
    v_conflicts := v_conflicts || jsonb_build_array('Tem ' || v_member_count || ' membros mas o plano permite apenas ' || v_plan.max_members);
  END IF;

  IF v_plan.max_portfolios != -1 AND v_portfolio_count > v_plan.max_portfolios THEN
    v_conflicts := v_conflicts || jsonb_build_array('Tem ' || v_portfolio_count || ' portfólios mas o plano permite apenas ' || v_plan.max_portfolios);
  END IF;

  RETURN jsonb_build_object(
    'allowed', jsonb_array_length(v_conflicts) = 0,
    'conflicts', v_conflicts
  );
END;
$$;
