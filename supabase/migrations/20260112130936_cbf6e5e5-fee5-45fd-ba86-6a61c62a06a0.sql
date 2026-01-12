-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL,
  accepted_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can view all invitations"
ON public.invitations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert invitations"
ON public.invitations FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invitations"
ON public.invitations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations"
ON public.invitations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to apply invitation role on signup
CREATE OR REPLACE FUNCTION public.apply_invitation_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check for valid invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Update user role to the invited role (delete default member role first if different)
    IF invitation_record.role != 'member' THEN
      UPDATE public.user_roles 
      SET role = invitation_record.role 
      WHERE user_id = NEW.id;
    END IF;
    
    -- Mark invitation as accepted
    UPDATE public.invitations 
    SET accepted_at = now() 
    WHERE id = invitation_record.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user is created
CREATE TRIGGER on_auth_user_created_apply_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_invitation_role();