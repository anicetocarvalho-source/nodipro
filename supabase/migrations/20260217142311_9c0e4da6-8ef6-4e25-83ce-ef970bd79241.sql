
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_action TEXT;
  v_target_id TEXT;
  v_target_name TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_record JSONB;
BEGIN
  v_user_id := auth.uid();
  SELECT full_name INTO v_user_name FROM public.profiles WHERE user_id = v_user_id LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_target_id := NEW.id::text;
    v_record := row_to_json(NEW)::jsonb;
    v_target_name := COALESCE(v_record->>'name', v_record->>'title', v_target_id);
    v_new_value := v_record::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_target_id := NEW.id::text;
    v_record := row_to_json(NEW)::jsonb;
    v_target_name := COALESCE(v_record->>'name', v_record->>'title', v_target_id);
    v_old_value := row_to_json(OLD)::text;
    v_new_value := v_record::text;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_target_id := OLD.id::text;
    v_record := row_to_json(OLD)::jsonb;
    v_target_name := COALESCE(v_record->>'name', v_record->>'title', v_target_id);
    v_old_value := v_record::text;
  END IF;

  INSERT INTO public.audit_logs (user_id, user_name, action, target_type, target_id, target_name, old_value, new_value)
  VALUES (COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'), v_user_name, v_action, TG_TABLE_NAME, v_target_id, v_target_name, v_old_value, v_new_value);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;
