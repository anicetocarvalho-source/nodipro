-- Create dependency type enum
CREATE TYPE public.dependency_type AS ENUM ('FS', 'SS', 'FF', 'SF');

-- Create task_dependencies junction table for many-to-many dependencies
CREATE TABLE public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  predecessor_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type public.dependency_type NOT NULL DEFAULT 'FS',
  lag_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate dependencies
  CONSTRAINT unique_task_predecessor UNIQUE (task_id, predecessor_id),
  -- Prevent self-references
  CONSTRAINT no_self_dependency CHECK (task_id != predecessor_id)
);

-- Enable RLS
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view task dependencies"
ON public.task_dependencies
FOR SELECT
USING (true);

CREATE POLICY "Users with permission can create task dependencies"
ON public.task_dependencies
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'task.create'::text));

CREATE POLICY "Users with permission can update task dependencies"
ON public.task_dependencies
FOR UPDATE
USING (has_permission(auth.uid(), 'task.edit'::text));

CREATE POLICY "Users with permission can delete task dependencies"
ON public.task_dependencies
FOR DELETE
USING (has_permission(auth.uid(), 'task.delete'::text));

-- Create index for faster lookups
CREATE INDEX idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_predecessor_id ON public.task_dependencies(predecessor_id);

-- Function to check if adding a dependency would create a circular reference
CREATE OR REPLACE FUNCTION public.check_circular_dependency(
  p_task_id UUID,
  p_predecessor_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_found BOOLEAN := FALSE;
BEGIN
  -- Use recursive CTE to check for cycles
  WITH RECURSIVE dependency_chain AS (
    -- Start with the predecessor
    SELECT predecessor_id, task_id, 1 as depth
    FROM public.task_dependencies
    WHERE task_id = p_predecessor_id
    
    UNION ALL
    
    -- Recursively find all predecessors
    SELECT td.predecessor_id, td.task_id, dc.depth + 1
    FROM public.task_dependencies td
    INNER JOIN dependency_chain dc ON td.task_id = dc.predecessor_id
    WHERE dc.depth < 100 -- Prevent infinite loops
  )
  SELECT EXISTS (
    SELECT 1 FROM dependency_chain WHERE predecessor_id = p_task_id
  ) INTO v_found;
  
  RETURN v_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to validate task can start based on dependencies
CREATE OR REPLACE FUNCTION public.can_task_start(p_task_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  v_can_start BOOLEAN := TRUE;
  v_dep RECORD;
BEGIN
  FOR v_dep IN 
    SELECT td.dependency_type, t.column_id, t.due_date
    FROM public.task_dependencies td
    JOIN public.tasks t ON t.id = td.predecessor_id
    WHERE td.task_id = p_task_id
  LOOP
    CASE v_dep.dependency_type
      WHEN 'FS' THEN
        -- Finish-to-Start: predecessor must be done
        IF v_dep.column_id != 'done' THEN
          v_can_start := FALSE;
          EXIT;
        END IF;
      WHEN 'SS' THEN
        -- Start-to-Start: predecessor must have started (not in backlog/todo)
        IF v_dep.column_id IN ('backlog', 'todo') THEN
          v_can_start := FALSE;
          EXIT;
        END IF;
      WHEN 'FF', 'SF' THEN
        -- These don't block start
        NULL;
    END CASE;
  END LOOP;
  
  RETURN v_can_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for task_dependencies
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_dependencies;

-- Add comment explaining dependency types
COMMENT ON TYPE public.dependency_type IS 'FS=Finish-to-Start (default), SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish';