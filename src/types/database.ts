// Custom types for database tables until auto-generated types are updated

export type TaskPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'active' | 'delayed' | 'completed' | 'on_hold';
export type ProjectMethodology = 'waterfall' | 'scrum' | 'kanban' | 'hybrid';
export type ScrumRole = 'product_owner' | 'scrum_master' | 'dev_team';
export type TaskItemType = 'epic' | 'story' | 'task';
export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';
export type RetroCategory = 'went_well' | 'needs_improvement' | 'keep_doing' | 'change' | 'props';
export type RetroStatus = 'open' | 'in_progress' | 'completed';
export type BriefingStatus = 'draft' | 'published' | 'archived';
export type BriefingModuleType = 'section' | 'objective' | 'requirement' | 'dependency';

export const PROJECT_STATUS_OPTIONS = ['active', 'delayed', 'completed', 'on_hold'] as const;
export const PROJECT_METHODOLOGY_OPTIONS: { value: ProjectMethodology; label: string; description: string }[] = [
  { value: 'waterfall', label: 'Cascata (Waterfall)', description: 'Fases sequenciais e previsíveis' },
  { value: 'scrum', label: 'Scrum', description: 'Sprints iterativos com cerimónias ágeis' },
  { value: 'kanban', label: 'Kanban', description: 'Fluxo contínuo e visual' },
  { value: 'hybrid', label: 'Híbrido', description: 'Combina fases sequenciais com sprints' },
];
export const SCRUM_ROLE_OPTIONS: { value: ScrumRole; label: string; description: string }[] = [
  { value: 'product_owner', label: 'Product Owner', description: 'Responsável pelo backlog e prioridades' },
  { value: 'scrum_master', label: 'Scrum Master', description: 'Facilitador e guardião do processo Scrum' },
  { value: 'dev_team', label: 'Development Team', description: 'Equipa de desenvolvimento auto-organizada' },
];
export const TASK_ITEM_TYPES: { value: TaskItemType; label: string; color: string }[] = [
  { value: 'epic', label: 'Épico', color: 'bg-purple-500' },
  { value: 'story', label: 'História', color: 'bg-blue-500' },
  { value: 'task', label: 'Tarefa', color: 'bg-green-500' },
];

export const RETRO_CATEGORIES: { value: RetroCategory; label: string; icon: string; color: string }[] = [
  { value: 'went_well', label: 'O que correu bem', icon: '✅', color: 'bg-green-500/10 border-green-500/30' },
  { value: 'needs_improvement', label: 'O que precisa melhorar', icon: '⚠️', color: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'keep_doing', label: 'O que continuar', icon: '🔄', color: 'bg-blue-500/10 border-blue-500/30' },
  { value: 'change', label: 'O que mudar', icon: '🔀', color: 'bg-red-500/10 border-red-500/30' },
  { value: 'props', label: 'Props / Reconhecimento', icon: '🏆', color: 'bg-yellow-500/10 border-yellow-500/30' },
];

export interface DbProject {
  id: string;
  name: string;
  description: string | null;
  client: string | null;
  status: ProjectStatus;
  methodology: ProjectMethodology;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  spent: number | null;
  program_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScrumConfig {
  id: string;
  project_id: string;
  default_sprint_duration_days: number;
  definition_of_done: string[];
  sprint_planning_duration_hours: number;
  daily_standup_duration_minutes: number;
  sprint_review_duration_hours: number;
  retrospective_duration_hours: number;
  created_at: string;
  updated_at: string;
}

export interface DbScrumRoleAssignment {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string | null;
  scrum_role: ScrumRole;
  created_at: string;
}

export interface DbTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  column_id: string;
  position: number;
  assignee_name: string | null;
  assignee_initials: string | null;
  due_date: string | null;
  labels: string[] | null;
  comments_count: number | null;
  attachments_count: number | null;
  item_type: TaskItemType;
  parent_id: string | null;
  story_points: number | null;
  sprint_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSubtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface DbTeamMember {
  id: string;
  project_id: string;
  name: string;
  initials: string;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbSprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  velocity: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRetrospective {
  id: string;
  sprint_id: string;
  project_id: string;
  status: RetroStatus;
  facilitator_id: string | null;
  facilitator_name: string | null;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DbRetroItem {
  id: string;
  retrospective_id: string;
  category: RetroCategory;
  content: string;
  author_id: string | null;
  author_name: string | null;
  votes_count: number;
  created_at: string;
}

export interface DbRetroVote {
  id: string;
  item_id: string;
  user_id: string;
  created_at: string;
}

export interface DbRetroFeedback {
  id: string;
  retrospective_id: string;
  user_id: string;
  user_name: string | null;
  satisfaction_rating: number | null;
  velocity_rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface DbRetroAction {
  id: string;
  retrospective_id: string;
  description: string;
  assignee_id: string | null;
  assignee_name: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface DbBriefing {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: BriefingStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBriefingModule {
  id: string;
  briefing_id: string;
  title: string;
  content: string | null;
  level: number;
  parent_id: string | null;
  position: number;
  module_type: BriefingModuleType;
  status: string;
  created_at: string;
  updated_at: string;
}

// Insert types
export type DbProjectInsert = Omit<DbProject, 'id' | 'created_at' | 'updated_at' | 'methodology'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  methodology?: ProjectMethodology;
};

export type DbTaskInsert = Omit<DbTask, 'id' | 'created_at' | 'updated_at' | 'item_type' | 'parent_id' | 'story_points' | 'sprint_id'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  item_type?: TaskItemType;
  parent_id?: string | null;
  story_points?: number | null;
  sprint_id?: string | null;
};

export type DbSubtaskInsert = Omit<DbSubtask, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type DbTeamMemberInsert = Omit<DbTeamMember, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type DbSprintInsert = Omit<DbSprint, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
