// Custom types for database tables until auto-generated types are updated

export type TaskPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'active' | 'delayed' | 'completed' | 'on_hold';
export const PROJECT_STATUS_OPTIONS = ['active', 'delayed', 'completed', 'on_hold'] as const;

export interface DbProject {
  id: string;
  name: string;
  description: string | null;
  client: string | null;
  status: ProjectStatus;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  spent: number | null;
  program_id: string | null;
  created_at: string;
  updated_at: string;
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

// Insert types
export type DbProjectInsert = Omit<DbProject, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DbTaskInsert = Omit<DbTask, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DbSubtaskInsert = Omit<DbSubtask, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type DbTeamMemberInsert = Omit<DbTeamMember, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
