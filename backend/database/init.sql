-- ============================================================
-- DeciSmart Database - Complete Initialization Script
-- Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. DECISIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  domain_category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);

-- ============================================================
-- 3. ALTERNATIVES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  enriched_data JSONB DEFAULT '{}',
  order_index SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alternatives_decision_id ON alternatives(decision_id);

-- ============================================================
-- 4. CRITERIA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  weight DECIMAL(5,2) NOT NULL CHECK (weight BETWEEN 0 AND 100),
  type VARCHAR(10) NOT NULL CHECK (type IN ('benefit', 'cost')),
  description TEXT,
  order_index SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_criteria_decision_id ON criteria(decision_id);

-- ============================================================
-- 5. SCORES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alternative_id UUID NOT NULL REFERENCES alternatives(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  raw_value DECIMAL(10,4),
  normalized_value DECIMAL(5,4) CHECK (normalized_value IS NULL OR (normalized_value >= 0 AND normalized_value <= 1)),
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'ai_enrichment', 'external_api')),
  UNIQUE (alternative_id, criteria_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_alternative_id ON scores(alternative_id);
CREATE INDEX IF NOT EXISTS idx_scores_criteria_id ON scores(criteria_id);

-- ============================================================
-- 6. RECOMMENDATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID UNIQUE NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  ranked_alternatives JSONB NOT NULL,
  mcdm_scores JSONB NOT NULL,
  ai_reasoning TEXT NOT NULL,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_decision_id ON recommendations(decision_id);

-- ============================================================
-- 7. DECISION HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS decision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('created', 'analyzed', 'viewed', 'duplicated', 'archived', 'deleted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_history_user_id ON decision_history(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_history_decision_id ON decision_history(decision_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to decisions table
DROP TRIGGER IF EXISTS trigger_decisions_updated_at ON decisions;
CREATE TRIGGER trigger_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_history ENABLE ROW LEVEL SECURITY;

-- USERS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- DECISIONS policies
DROP POLICY IF EXISTS "Users can view own decisions" ON decisions;
CREATE POLICY "Users can view own decisions"
  ON decisions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own decisions" ON decisions;
CREATE POLICY "Users can create own decisions"
  ON decisions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own decisions" ON decisions;
CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own decisions" ON decisions;
CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (user_id = auth.uid());

-- ALTERNATIVES policies
DROP POLICY IF EXISTS "Users can view own alternatives" ON alternatives;
CREATE POLICY "Users can view own alternatives"
  ON alternatives FOR SELECT
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create alternatives for own decisions" ON alternatives;
CREATE POLICY "Users can create alternatives for own decisions"
  ON alternatives FOR INSERT
  WITH CHECK (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update alternatives of own decisions" ON alternatives;
CREATE POLICY "Users can update alternatives of own decisions"
  ON alternatives FOR UPDATE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete alternatives of own decisions" ON alternatives;
CREATE POLICY "Users can delete alternatives of own decisions"
  ON alternatives FOR DELETE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

-- CRITERIA policies
DROP POLICY IF EXISTS "Users can view own criteria" ON criteria;
CREATE POLICY "Users can view own criteria"
  ON criteria FOR SELECT
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create criteria for own decisions" ON criteria;
CREATE POLICY "Users can create criteria for own decisions"
  ON criteria FOR INSERT
  WITH CHECK (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update criteria of own decisions" ON criteria;
CREATE POLICY "Users can update criteria of own decisions"
  ON criteria FOR UPDATE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete criteria of own decisions" ON criteria;
CREATE POLICY "Users can delete criteria of own decisions"
  ON criteria FOR DELETE
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

-- SCORES policies
DROP POLICY IF EXISTS "Users can view own scores" ON scores;
CREATE POLICY "Users can view own scores"
  ON scores FOR SELECT
  USING (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create scores for own alternatives" ON scores;
CREATE POLICY "Users can create scores for own alternatives"
  ON scores FOR INSERT
  WITH CHECK (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update scores of own alternatives" ON scores;
CREATE POLICY "Users can update scores of own alternatives"
  ON scores FOR UPDATE
  USING (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete scores of own alternatives" ON scores;
CREATE POLICY "Users can delete scores of own alternatives"
  ON scores FOR DELETE
  USING (alternative_id IN (
    SELECT a.id FROM alternatives a
    JOIN decisions d ON a.decision_id = d.id
    WHERE d.user_id = auth.uid()
  ));

-- RECOMMENDATIONS policies
DROP POLICY IF EXISTS "Users can view own recommendations" ON recommendations;
CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  USING (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "System can create recommendations" ON recommendations;
CREATE POLICY "System can create recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (decision_id IN (SELECT id FROM decisions WHERE user_id = auth.uid()));

-- DECISION HISTORY policies
DROP POLICY IF EXISTS "Users can view own history" ON decision_history;
CREATE POLICY "Users can view own history"
  ON decision_history FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create history entries" ON decision_history;
CREATE POLICY "System can create history entries"
  ON decision_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SEED DATA (Optional - Admin user)
-- ============================================================
-- INSERT INTO users (email, password_hash, full_name, role)
-- VALUES ('admin@decismart.com', '$2a$12$placeholder_hash_here', 'Admin', 'admin');
