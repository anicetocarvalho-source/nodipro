export type DocumentStatus = 'draft' | 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'archived';
export type WorkflowStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
export type WorkflowType = 'approval' | 'review' | 'signature';
export type WorkflowPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Document {
  id: string;
  project_id: string | null;
  phase_name: string | null;
  title: string;
  description: string | null;
  document_type: string;
  current_version: number;
  status: DocumentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: {
    id: string;
    name: string;
  };
  versions?: DocumentVersion[];
  workflows?: DocumentWorkflow[];
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  hash_sha256: string | null;
  change_summary: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface DocumentWorkflow {
  id: string;
  document_id: string;
  version_id: string | null;
  workflow_type: WorkflowType;
  status: WorkflowStatus;
  requested_by: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: WorkflowPriority;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assigned_user?: {
    full_name: string | null;
  };
}

export interface DocumentComment {
  id: string;
  document_id: string;
  version_id: string | null;
  parent_id: string | null;
  user_id: string | null;
  user_name: string | null;
  content: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  replies?: DocumentComment[];
}

export interface DocumentHistory {
  id: string;
  document_id: string;
  version_id: string | null;
  action: string;
  action_details: Record<string, any> | null;
  performed_by: string | null;
  performed_by_name: string | null;
  ip_address: string | null;
  created_at: string;
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Aguardando Revisão',
  in_review: 'Em Revisão',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  archived: 'Arquivado',
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
};

export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  approval: 'Aprovação',
  review: 'Revisão',
  signature: 'Assinatura',
};

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'general', label: 'Geral' },
  { value: 'report', label: 'Relatório' },
  { value: 'contract', label: 'Contrato' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'policy', label: 'Política' },
  { value: 'procedure', label: 'Procedimento' },
  { value: 'template', label: 'Template' },
  { value: 'memo', label: 'Memorando' },
  { value: 'minutes', label: 'Ata' },
  { value: 'invoice', label: 'Fatura' },
];
