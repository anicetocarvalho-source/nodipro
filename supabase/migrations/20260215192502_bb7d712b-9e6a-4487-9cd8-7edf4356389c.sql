
-- 1. Restringir document_history SELECT a membros da organização
DROP POLICY IF EXISTS "Authenticated users can view history" ON public.document_history;
CREATE POLICY "Org members can view document history"
ON public.document_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN projects p ON p.id = d.project_id
    WHERE d.id = document_history.document_id
    AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  OR EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_history.document_id
    AND d.project_id IS NULL
    AND auth.uid() IS NOT NULL
  )
);

-- 2. Conversations: permitir criador apagar conversas
CREATE POLICY "Creators can delete conversations"
ON public.conversations
FOR DELETE
USING (created_by = auth.uid());

-- 3. Conversation participants: permitir utilizadores saírem
CREATE POLICY "Users can leave conversations"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());

-- 4. Messages: permitir utilizadores editarem/apagarem as suas mensagens
CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid());

-- 5. Retrospective actions: permitir membros da org apagarem
CREATE POLICY "Org members can delete retro actions"
ON public.retrospective_actions
FOR DELETE
USING (
  retrospective_id IN (
    SELECT sprint_retrospectives.id
    FROM sprint_retrospectives
    WHERE sprint_retrospectives.project_id IN (
      SELECT projects.id FROM projects
      WHERE projects.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  )
);

-- 6. Retrospective feedback: permitir utilizadores removerem o próprio feedback
CREATE POLICY "Users can delete own feedback"
ON public.retrospective_feedback
FOR DELETE
USING (user_id = auth.uid());
