-- Enable realtime for remaining integrity-related tables (tasks already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;