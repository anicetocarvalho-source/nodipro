-- Create entity type enum
CREATE TYPE public.entity_type AS ENUM ('public', 'private', 'ngo');

-- Create organization size enum
CREATE TYPE public.organization_size AS ENUM ('small', 'medium', 'large', 'enterprise');

-- Create organizations table
CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    entity_type entity_type NOT NULL,
    sector_id UUID REFERENCES public.sectors(id),
    country TEXT DEFAULT 'Angola',
    province_id UUID REFERENCES public.provinces(id),
    size organization_size DEFAULT 'small',
    logo_url TEXT,
    website TEXT,
    description TEXT,
    -- Feature flags and settings
    settings JSONB DEFAULT '{
        "features": {
            "sdg_tracking": true,
            "funder_management": true,
            "multi_province": true,
            "compliance_reports": true,
            "budget_approval_workflow": true
        },
        "branding": {
            "primary_color": null,
            "logo_url": null
        },
        "defaults": {
            "currency": "AOA",
            "language": "pt",
            "timezone": "Africa/Luanda"
        }
    }'::jsonb,
    -- Onboarding status
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create organization membership role enum
CREATE TYPE public.org_member_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- Create organization_members junction table
CREATE TABLE public.organization_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_member_role NOT NULL DEFAULT 'member',
    is_primary BOOLEAN DEFAULT false, -- User's primary organization
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    invited_by UUID REFERENCES auth.users(id),
    UNIQUE(organization_id, user_id)
);

-- Add organization_id to projects table for multi-tenant support
ALTER TABLE public.projects 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to portfolios table
ALTER TABLE public.portfolios 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Create indexes for performance
CREATE INDEX idx_organizations_entity_type ON public.organizations(entity_type);
CREATE INDEX idx_organizations_sector ON public.organizations(sector_id);
CREATE INDEX idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_projects_organization ON public.projects(organization_id);
CREATE INDEX idx_portfolios_organization ON public.portfolios(organization_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations RLS policies
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = organizations.id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Organization owners and admins can update"
ON public.organizations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only owners can delete organizations"
ON public.organizations
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
);

-- Organization members RLS policies
CREATE POLICY "Members can view their organization members"
ON public.organization_members
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Organization admins can manage members"
ON public.organization_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Users can insert themselves as owner when creating org"
ON public.organization_members
FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND role = 'owner'
    OR EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Update trigger for organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user's primary organization
CREATE OR REPLACE FUNCTION public.get_user_primary_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = _user_id
    AND is_primary = true
    LIMIT 1
$$;

-- Function to check if user needs onboarding
CREATE OR REPLACE FUNCTION public.user_needs_onboarding(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = _user_id
    )
$$;