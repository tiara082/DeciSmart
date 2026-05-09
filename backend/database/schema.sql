-- ============================================================
-- DeciSmart Database Schema
-- Supabase (PostgreSQL)
-- ============================================================

-- Enable UUID extension
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

-- Index for email lookups
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
