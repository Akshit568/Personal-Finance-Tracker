-- ===========================================================================
-- Personal Finance Tracker — Indexes
-- Run AFTER schema.sql:
--   psql -U postgres -d finance_tracker -f sql/indexes.sql
-- ===========================================================================

-- Fast login / uniqueness lookups (unique constraint already indexes email,
-- this adds a case-insensitive lookup path).
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role        ON users (role);

-- Category filtering by type.
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);

-- Transaction access patterns:
--   - list/search by owner
--   - filter by owner + date range (analytics + listing)
--   - filter by owner + type
--   - filter by owner + category
CREATE INDEX IF NOT EXISTS idx_tx_user             ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_tx_user_date        ON transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_user_type        ON transactions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_tx_user_category    ON transactions (user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_tx_date             ON transactions (transaction_date);

-- Case-insensitive text search on description.
CREATE INDEX IF NOT EXISTS idx_tx_description_lower ON transactions (LOWER(description));
