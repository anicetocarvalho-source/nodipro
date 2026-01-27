export type EntityType = 'public' | 'private' | 'ngo';
export type OrganizationSize = 'small' | 'medium' | 'large' | 'enterprise';
export type OrgMemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface OrganizationSettings {
  features: {
    sdg_tracking: boolean;
    funder_management: boolean;
    multi_province: boolean;
    compliance_reports: boolean;
    budget_approval_workflow: boolean;
  };
  branding: {
    primary_color: string | null;
    logo_url: string | null;
  };
  defaults: {
    currency: string;
    language: string;
    timezone: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  entity_type: EntityType;
  sector_id: string | null;
  country: string;
  province_id: string | null;
  size: OrganizationSize;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  settings: OrganizationSettings;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  is_primary: boolean;
  joined_at: string;
  invited_by: string | null;
}

// Entity type specific feature configurations
export const ENTITY_FEATURES: Record<EntityType, Partial<OrganizationSettings['features']>> = {
  public: {
    sdg_tracking: true,
    funder_management: true,
    multi_province: true,
    compliance_reports: true,
    budget_approval_workflow: true,
  },
  private: {
    sdg_tracking: false,
    funder_management: false,
    multi_province: false,
    compliance_reports: false,
    budget_approval_workflow: false,
  },
  ngo: {
    sdg_tracking: true,
    funder_management: true,
    multi_province: true,
    compliance_reports: true,
    budget_approval_workflow: false,
  },
};

// Labels for entity types
export const ENTITY_TYPE_LABELS: Record<EntityType, { label: string; description: string }> = {
  public: {
    label: 'Entidade Pública',
    description: 'Ministérios, agências governamentais, autarquias e empresas públicas',
  },
  private: {
    label: 'Empresa Privada',
    description: 'Empresas comerciais, startups e consultoras',
  },
  ngo: {
    label: 'ONG / Organização Social',
    description: 'Organizações não-governamentais, fundações e associações',
  },
};

// Labels for organization sizes
export const ORG_SIZE_LABELS: Record<OrganizationSize, { label: string; employees: string }> = {
  small: { label: 'Pequena', employees: '1-50 colaboradores' },
  medium: { label: 'Média', employees: '51-200 colaboradores' },
  large: { label: 'Grande', employees: '201-1000 colaboradores' },
  enterprise: { label: 'Corporação', employees: '1000+ colaboradores' },
};
