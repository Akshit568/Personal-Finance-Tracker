-- ===========================================================================
-- Personal Finance Tracker — Schema
-- Idempotent: safe to run multiple times.
-- Run against the finance_tracker database:
--   psql -U postgres -d finance_tracker -f sql/schema.sql
-- ===========================================================================

-- Enumerated types --------------------------------------------------------- --
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user', 'read-only');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('income', 'expense');
    END IF;
END$$;

-- Users -------------------------------------------------------------------- --
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(120)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          user_role     NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Categories --------------------------------------------------------------- --
-- Categories are shared reference data (seedable) and managed by admins.
CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(80)       NOT NULL,
    type       transaction_type  NOT NULL,
    created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_category_name_type UNIQUE (name, type)
);

-- Transactions ------------------------------------------------------------- --
CREATE TABLE IF NOT EXISTS transactions (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id      INTEGER          REFERENCES categories(id) ON DELETE SET NULL,
    type             transaction_type NOT NULL,
    amount           NUMERIC(14, 2)   NOT NULL CHECK (amount > 0),
    description      TEXT,
    transaction_date DATE             NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Keep updated_at fresh on every UPDATE ------------------------------------ --
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
