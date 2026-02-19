-- Migration 09: Community voting on proposals
-- Members can upvote proposals they support.
-- One vote per member per proposal. Votes are visible to all members.

CREATE TABLE IF NOT EXISTS votes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID        NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  member_id   UUID        NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, member_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- All signed-in members can read votes (needed to show counts and own vote)
CREATE POLICY "Members can read votes" ON votes
  FOR SELECT
  TO authenticated
  USING (true);

-- Members can vote (insert), identified by member_id matching their auth session
CREATE POLICY "Members can insert own vote" ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE auth_id = auth.uid() AND status = 'active')
  );

-- Members can remove their own vote
CREATE POLICY "Members can delete own vote" ON votes
  FOR DELETE
  TO authenticated
  USING (
    member_id IN (SELECT id FROM members WHERE auth_id = auth.uid() AND status = 'active')
  );
