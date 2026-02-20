
CREATE OR REPLACE FUNCTION public.platform_create_organization(
  _name text,
  _entity_type text,
  _sector_id uuid DEFAULT NULL,
  _province_id uuid DEFAULT NULL,
  _size text DEFAULT 'small',
  _description text DEFAULT NULL,
  _owner_email text DEFAULT NULL,
  _plan_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_slug text;
  v_owner_id uuid;
  v_owner_found boolean := false;
  v_admin_id uuid;
  v_admin_name text;
BEGIN
  -- Check platform admin
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_admin_id := auth.uid();
  SELECT full_name INTO v_admin_name FROM public.profiles WHERE user_id = v_admin_id LIMIT 1;

  -- Generate slug from name
  v_slug := lower(regexp_replace(trim(_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+$', '');
  -- Ensure uniqueness
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;

  -- Create organization
  INSERT INTO organizations (name, slug, entity_type, sector_id, province_id, size, description, onboarding_completed, onboarding_step, country, created_by)
  VALUES (_name, v_slug, _entity_type::entity_type, _sector_id, _province_id, COALESCE(_size, 'small')::organization_size, _description, true, 5, 'AO', v_admin_id)
  RETURNING id INTO v_org_id;

  -- Find owner by email
  IF _owner_email IS NOT NULL AND _owner_email != '' THEN
    SELECT id INTO v_owner_id FROM auth.users WHERE email = lower(trim(_owner_email)) LIMIT 1;
    IF v_owner_id IS NOT NULL THEN
      v_owner_found := true;
      INSERT INTO organization_members (organization_id, user_id, role, is_primary, invited_by)
      VALUES (v_org_id, v_owner_id, 'owner', true, v_admin_id);
    END IF;
  END IF;

  -- Create subscription if plan provided
  IF _plan_id IS NOT NULL THEN
    INSERT INTO organization_subscriptions (organization_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
    VALUES (v_org_id, _plan_id, 'trial', now() + interval '14 days', now(), now() + interval '14 days');
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, user_name, action, target_type, target_id, target_name, new_value)
  VALUES (v_admin_id, v_admin_name, 'create', 'organization', v_org_id::text, _name,
    jsonb_build_object('entity_type', _entity_type, 'owner_email', _owner_email, 'owner_found', v_owner_found)::text);

  RETURN jsonb_build_object(
    'org_id', v_org_id,
    'slug', v_slug,
    'owner_found', v_owner_found,
    'owner_email', _owner_email
  );
END;
$$;
