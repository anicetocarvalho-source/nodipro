import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string | null;
  type: "project" | "task" | "document";
  href: string;
  status?: string;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 300);

  const { data: projects, isFetching: fetchingProjects } = useQuery({
    queryKey: ["global-search-projects", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, client")
        .ilike("name", `%${debouncedQuery}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const { data: tasks, isFetching: fetchingTasks } = useQuery({
    queryKey: ["global-search-tasks", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, column_id, project_id, priority")
        .ilike("title", `%${debouncedQuery}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const { data: documents, isFetching: fetchingDocuments } = useQuery({
    queryKey: ["global-search-documents", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, document_type, status, project_id")
        .ilike("title", `%${debouncedQuery}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const results = useMemo<SearchResult[]>(() => {
    const items: SearchResult[] = [];

    projects?.forEach((p) =>
      items.push({
        id: p.id,
        title: p.name,
        subtitle: p.client,
        type: "project",
        href: `/projects/${p.id}`,
        status: p.status,
      })
    );

    tasks?.forEach((t) =>
      items.push({
        id: t.id,
        title: t.title,
        subtitle: t.column_id,
        type: "task",
        href: `/projects/${t.project_id}`,
        status: t.priority,
      })
    );

    documents?.forEach((d) =>
      items.push({
        id: d.id,
        title: d.title,
        subtitle: d.document_type,
        type: "document",
        href: `/documents`,
        status: d.status,
      })
    );

    return items;
  }, [projects, tasks, documents]);

  const isLoading = fetchingProjects || fetchingTasks || fetchingDocuments;

  return { query, setQuery, results, isLoading, debouncedQuery };
}
