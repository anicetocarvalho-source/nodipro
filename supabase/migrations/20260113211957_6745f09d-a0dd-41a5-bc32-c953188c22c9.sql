-- Step 1: Add new role values to existing enum (must be committed separately)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'portfolio_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'observer';