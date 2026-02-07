// Portfolio and Program types

export interface DbPortfolio {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  organization_id: string | null;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface DbProgram {
  id: string;
  portfolio_id: string;
  name: string;
  description: string | null;
  sector: string | null;
  manager_id: string | null;
  status: 'active' | 'inactive' | 'completed';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type DbPortfolioInsert = Omit<DbPortfolio, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DbProgramInsert = Omit<DbProgram, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// Extended types with aggregations
export interface PortfolioWithStats extends DbPortfolio {
  programs_count: number;
  projects_count: number;
  total_budget: number;
  total_spent: number;
  average_progress: number;
}

export interface ProgramWithStats extends DbProgram {
  portfolio_name?: string;
  projects_count: number;
  total_budget: number;
  total_spent: number;
  average_progress: number;
  projects_at_risk: number;
}
