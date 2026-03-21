import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Organization, OrganizationMember, EntityType, OrganizationSettings, ENTITY_FEATURES } from '@/types/organization';
import type { Json } from '@/integrations/supabase/types';

// Helper to parse settings from JSON
const parseSettings = (settings: Json | null): OrganizationSettings => {
  const defaultSettings: OrganizationSettings = {
    features: {
      sdg_tracking: true,
      funder_management: true,
      multi_province: true,
      compliance_reports: true,
      budget_approval_workflow: true,
    },
    branding: {
      primary_color: null,
      logo_url: null,
    },
    defaults: {
      currency: 'AOA',
      language: 'pt',
      timezone: 'Africa/Luanda',
    },
  };
  
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return defaultSettings;
  }
  
  const s = settings as Record<string, unknown>;
  return {
    features: {
      ...defaultSettings.features,
      ...(typeof s.features === 'object' ? s.features as Record<string, boolean> : {}),
    },
    branding: {
      ...defaultSettings.branding,
      ...(typeof s.branding === 'object' ? s.branding as Record<string, string | null> : {}),
    },
    defaults: {
      ...defaultSettings.defaults,
      ...(typeof s.defaults === 'object' ? s.defaults as Record<string, string> : {}),
    },
  };
};

// Helper to convert DB row to Organization type
const toOrganization = (row: any): Organization => ({
  ...row,
  settings: parseSettings(row.settings),
});

interface OrganizationContextType {
  organization: Organization | null;
  organizations: Organization[];
  membership: OrganizationMember | null;
  loading: boolean;
  needsOnboarding: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganization: () => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization | null>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  hasFeature: (feature: keyof typeof ENTITY_FEATURES.public) => boolean;
  entityType: EntityType | null;
}

interface CreateOrganizationData {
  name: string;
  entity_type: EntityType;
  sector_id?: string | null;
  province_id?: string | null;
  size?: Organization['size'];
  description?: string;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setOrganization(null);
      setMembership(null);
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    try {
      // Fetch user's organization memberships using direct query without join first
      // to avoid RLS issues with empty organizations
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id);

      // If error or no memberships, user needs onboarding (temporarily disabled)
      if (memberError || !memberships || memberships.length === 0) {
        console.log('No organization memberships found, user needs onboarding');
        setNeedsOnboarding(true);
        setOrganizations([]);
        setOrganization(null);
        setMembership(null);
        setLoading(false);
        return;
      }

      // Now fetch organizations separately
      const orgIds = memberships.map(m => m.organization_id);
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgsError || !orgsData || orgsData.length === 0) {
        console.log('No organizations found, user needs onboarding');
        setNeedsOnboarding(true);
        setOrganizations([]);
        setOrganization(null);
        setMembership(null);
        setLoading(false);
        return;
      }

      setNeedsOnboarding(false);
      
      // Convert to proper types
      const orgs = orgsData.map(toOrganization);
      setOrganizations(orgs);

      // Find primary organization or use the first one
      const primaryMembership = memberships.find((m: any) => m.is_primary) || memberships[0];
      
      if (primaryMembership) {
        const matchingOrg = orgsData.find(o => o.id === primaryMembership.organization_id);
        if (matchingOrg) {
          setMembership(primaryMembership as OrganizationMember);
          setOrganization(toOrganization(matchingOrg));
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrganizations();
    }
  }, [authLoading, fetchOrganizations]);

  const switchOrganization = async (orgId: string) => {
    if (!user) return;

    try {
      // Update current primary to false
      if (membership) {
        await supabase
          .from('organization_members')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .eq('is_primary', true);
      }

      // Set new organization as primary
      await supabase
        .from('organization_members')
        .update({ is_primary: true })
        .eq('user_id', user.id)
        .eq('organization_id', orgId);

      // Refresh data
      await fetchOrganizations();
    } catch (error) {
      console.error('Error switching organization:', error);
      throw error;
    }
  };

  const refreshOrganization = async () => {
    await fetchOrganizations();
  };

  const createOrganization = async (data: CreateOrganizationData): Promise<Organization | null> => {
    if (!user) return null;

    try {
      // Generate slug from name
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create organization with type-safe settings
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: `${slug}-${Date.now().toString(36)}`,
          entity_type: data.entity_type,
          sector_id: data.sector_id || null,
          province_id: data.province_id || null,
          size: data.size || 'small',
          description: data.description || null,
          created_by: user.id,
          onboarding_completed: false,
          onboarding_step: 1,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          is_primary: true,
        });

      if (memberError) throw memberError;

      await fetchOrganizations();
      return toOrganization(org);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const updateOrganization = async (data: Partial<Organization>) => {
    if (!organization) return;

    try {
      // Convert settings to JSON if present
      const updateData: Record<string, any> = { ...data };
      if (data.settings) {
        updateData.settings = data.settings as unknown as Json;
      }
      
      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (error) throw error;

      await fetchOrganizations();
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!organization?.settings?.features) return false;
    return (organization.settings.features as Record<string, boolean>)[feature] ?? false;
  };

  const entityType = organization?.entity_type ?? null;

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizations,
        membership,
        loading,
        needsOnboarding,
        switchOrganization,
        refreshOrganization,
        createOrganization,
        updateOrganization,
        hasFeature,
        entityType,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
