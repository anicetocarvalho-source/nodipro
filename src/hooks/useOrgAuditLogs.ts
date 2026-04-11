import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface OrgAuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  user_id: string;
  user_name: string | null;
  created_at: string;
}

export interface OrgAuditResult {
  logs: OrgAuditLog[];
  total: number;
}

export function useOrgAuditLogs() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (params: {
    limit?: number;
    offset?: number;
    action_filter?: string | null;
    target_filter?: string | null;
    search?: string | null;
  }): Promise<OrgAuditResult> => {
    if (!organization?.id) return { logs: [], total: 0 };
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_org_audit_logs", {
        _org_id: organization!.id,
        _limit: params.limit || 50,
        _offset: params.offset || 0,
        _action_filter: params.action_filter || null,
        _target_filter: params.target_filter || null,
        _search: params.search || null,
      });
      if (error) throw error;
      const result = data as unknown as { logs: OrgAuditLog[]; total: number };
      return { logs: result.logs || [], total: result.total || 0 };
    } catch {
      return { logs: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  return { fetchLogs, loading };
}
