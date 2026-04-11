
-- The shared org ID
-- 14774892-544e-4cbb-9c40-8331538bbcfa = Ministério das Infraestruturas de Angola

-- Orgs to delete:
-- f69579e3-a6ee-4b07-831c-9e426a4774e1 = Test Org Direct
-- ee8a9c17-b9c5-4eba-aa9f-8a46aa2d1cad = TechCorp Angola
-- ace8b5ba-cecf-48cb-9311-13503ca40481 = Mwango Brain
-- f4fdcac3-f95d-4f4a-a68a-59bab4f73f0b = Tech

-- Step 1: Move orphaned portfolios to shared org
UPDATE public.portfolios 
SET organization_id = '14774892-544e-4cbb-9c40-8331538bbcfa'
WHERE organization_id IN (
  'f69579e3-a6ee-4b07-831c-9e426a4774e1',
  'ee8a9c17-b9c5-4eba-aa9f-8a46aa2d1cad',
  'ace8b5ba-cecf-48cb-9311-13503ca40481',
  'f4fdcac3-f95d-4f4a-a68a-59bab4f73f0b'
);

-- Step 2: Delete memberships from orgs being removed
DELETE FROM public.organization_members
WHERE organization_id IN (
  'f69579e3-a6ee-4b07-831c-9e426a4774e1',
  'ee8a9c17-b9c5-4eba-aa9f-8a46aa2d1cad',
  'ace8b5ba-cecf-48cb-9311-13503ca40481',
  'f4fdcac3-f95d-4f4a-a68a-59bab4f73f0b'
);

-- Step 3: Delete subscriptions from orgs being removed
DELETE FROM public.organization_subscriptions
WHERE organization_id IN (
  'f69579e3-a6ee-4b07-831c-9e426a4774e1',
  'ee8a9c17-b9c5-4eba-aa9f-8a46aa2d1cad',
  'ace8b5ba-cecf-48cb-9311-13503ca40481',
  'f4fdcac3-f95d-4f4a-a68a-59bab4f73f0b'
);

-- Step 4: Delete the extra organizations
DELETE FROM public.organizations
WHERE id IN (
  'f69579e3-a6ee-4b07-831c-9e426a4774e1',
  'ee8a9c17-b9c5-4eba-aa9f-8a46aa2d1cad',
  'ace8b5ba-cecf-48cb-9311-13503ca40481',
  'f4fdcac3-f95d-4f4a-a68a-59bab4f73f0b'
);

-- Step 5: Set is_primary = true for all members of the shared org
UPDATE public.organization_members
SET is_primary = true
WHERE organization_id = '14774892-544e-4cbb-9c40-8331538bbcfa';
