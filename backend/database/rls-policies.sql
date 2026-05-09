-- ============================================================
-- DeciSmart RLS Policies
-- Row Level Security for all tables
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS policies
-- Users can read/update their own profile
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- DECISIONS policies
-- Users can CRUD their own decisions
-- ============================================================
CREATE POLICY "Users can view own decisions"
  ON decisions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own decisions"
  ON decisions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- ALTERNATIVES policies
-- Users can CRUD alternatives of their own decisions
-- ============================================================
CREATE POLICY "Users can view own alternatives"
  ON alternatives FOR SELECT
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create alternatives for own decisions"
  ON alternatives FOR INSERT
  WITH CHECK (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update alternatives of own decisions"
  ON alternatives FOR UPDATE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete alternatives of own decisions"
  ON alternatives FOR DELETE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

-- ============================================================
-- CRITERIA policies
-- Users can CRUD criteria of their own decisions
-- ============================================================
CREATE POLICY "Users can view own criteria"
  ON criteria FOR SELECT
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create criteria for own decisions"
  ON criteria FOR INSERT
  WITH CHECK (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update criteria of own decisions"
  ON criteria FOR UPDATE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete criteria of own decisions"
  ON criteria FOR DELETE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

-- ============================================================
-- SCORES policies
-- Users can CRUD scores of their own alternatives
-- ============================================================
CREATE POLICY "Users can view own scores"
  ON scores FOR SELECT
  USING (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY "Users can create scores for own alternatives"
  ON scores FOR INSERT
  WITH CHECK (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY "Users can update scores of own alternatives"
  ON scores FOR UPDATE
  USING (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete scores of own alternatives"
  ON scores FOR DELETE
  USING (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

-- ============================================================
-- RECOMMENDATIONS policies
-- Users can view recommendations of their own decisions
-- ============================================================
CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

CREATE POLICY "System can create recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

-- ============================================================
-- DECISION HISTORY policies
-- Users can view their own history
-- ============================================================
CREATE POLICY "Users can view own history"
  ON decision_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create history entries"
  ON decision_history FOR INSERT
  WITH CHECK (user_id = auth.uid());
