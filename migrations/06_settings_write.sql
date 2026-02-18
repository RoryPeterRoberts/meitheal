-- Allow admins and stewards to write community settings
-- (reads already allowed via "settings_read" policy in 00_base.sql)

CREATE POLICY "settings_write" ON settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'steward')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'steward')
    )
  );
