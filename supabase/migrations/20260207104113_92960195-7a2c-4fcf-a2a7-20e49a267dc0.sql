
-- Fix overly permissive INSERT policy on conversation_participants
DROP POLICY "Authenticated users can add participants" ON public.conversation_participants;

CREATE POLICY "Conversation members can add participants"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    -- User is the conversation creator
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
    )
    OR
    -- User is adding themselves
    user_id = auth.uid()
  );
