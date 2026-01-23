-- Drop the broken insert policy
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON public.votes;

-- Create a proper insert policy that allows authenticated users to insert their own votes
CREATE POLICY "Authenticated users can insert votes"
ON public.votes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())
);