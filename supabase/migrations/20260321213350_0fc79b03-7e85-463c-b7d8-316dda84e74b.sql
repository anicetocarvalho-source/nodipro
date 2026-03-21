-- Fix document_versions write policies to be org-scoped
DROP POLICY IF EXISTS "Users with permission can create versions" ON document_versions;
CREATE POLICY "Users with permission can create versions" ON document_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid(), 'project.edit')
    AND EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_versions.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users with permission can update versions" ON document_versions;
CREATE POLICY "Users with permission can update versions" ON document_versions
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.edit')
    AND EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_versions.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users with permission can delete versions" ON document_versions;
CREATE POLICY "Users with permission can delete versions" ON document_versions
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.delete')
    AND EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_versions.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

-- Fix document_workflows write policies to be org-scoped
DROP POLICY IF EXISTS "Users with permission can create workflows" ON document_workflows;
CREATE POLICY "Users with permission can create workflows" ON document_workflows
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid(), 'project.edit')
    AND EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_workflows.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users with permission can update workflows" ON document_workflows;
CREATE POLICY "Users with permission can update workflows" ON document_workflows
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.edit')
    AND EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_workflows.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users with permission can delete workflows" ON document_workflows;
CREATE POLICY "Users with permission can delete workflows" ON document_workflows
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.delete')
    AND EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_workflows.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

-- Fix document_comments INSERT to be org-scoped
DROP POLICY IF EXISTS "Authenticated users can create comments" ON document_comments;
CREATE POLICY "Users can create org document comments" ON document_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_comments.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

-- Fix project_sdgs to be org-scoped
DROP POLICY IF EXISTS "Users with permission can manage project SDGs" ON project_sdgs;
DROP POLICY IF EXISTS "project_sdgs_insert" ON project_sdgs;
DROP POLICY IF EXISTS "project_sdgs_delete" ON project_sdgs;

CREATE POLICY "Users can manage org project SDGs" ON project_sdgs
  FOR ALL TO authenticated
  USING (
    has_permission(auth.uid(), 'project.edit')
    AND project_in_user_orgs(project_id)
  )
  WITH CHECK (
    has_permission(auth.uid(), 'project.edit')
    AND project_in_user_orgs(project_id)
  );

-- Fix invitations to use authenticated role
DROP POLICY IF EXISTS "Admins can view invitations" ON invitations;
CREATE POLICY "Admins can view invitations" ON invitations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix organization_members: remove public role INSERT
DROP POLICY IF EXISTS "Users can create org membership as owner" ON organization_members;