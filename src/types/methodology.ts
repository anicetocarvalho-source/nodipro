// Types for methodology/template management

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface ProjectTemplate {
  id: string;
  sector_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sector?: Sector;
  phases?: TemplatePhase[];
}

export interface TemplatePhase {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  position: number;
  duration_days: number | null;
  created_at: string;
  deliverables?: TemplateDeliverable[];
}

export interface TemplateDeliverable {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  is_mandatory: boolean;
  position: number;
  created_at: string;
}

export interface TemplateDocument {
  id: string;
  phase_id: string | null;
  template_id: string;
  name: string;
  description: string | null;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  created_by: string | null;
  created_at: string;
}

// Insert types
export type SectorInsert = Omit<Sector, 'id' | 'created_at'>;
export type ProjectTemplateInsert = Omit<ProjectTemplate, 'id' | 'created_at' | 'updated_at' | 'sector' | 'phases'>;
export type TemplatePhaseInsert = Omit<TemplatePhase, 'id' | 'created_at' | 'deliverables'>;
export type TemplateDeliverableInsert = Omit<TemplateDeliverable, 'id' | 'created_at'>;
export type TemplateDocumentInsert = Omit<TemplateDocument, 'id' | 'created_at'>;
