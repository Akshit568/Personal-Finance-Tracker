-- ===========================================================================
-- Personal Finance Tracker — Seed data
-- Run AFTER schema.sql (and ideally indexes.sql):
--   psql -U postgres -d finance_tracker -f sql/seed.sql
--
-- Demo accounts (email / password):
--   admin@finance.com  / Admin@123    (role: admin)
--   user@finance.com   / User@123     (role: user)
--   viewer@finance.com / Viewer@123   (role: read-only)
--
-- Password hashes below are real bcrypt hashes of the passwords above.
-- Idempotent: re-running will not create duplicates.
-- ===========================================================================

-- Users -------------------------------------------------------------------- --
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User',  'admin@finance.com',  '$2a$10$njrMUOjC4qwSuN/xDG1gcuBQ01XrFmETHcZO.XJG0bw9P6SBhGJ62', 'admin'),
    ('Regular User','user@finance.com',   '$2a$10$njrMUOjC4qwSuN/xDG1gcubc4LYDnFEHys56ieb1JygcK2CpXlWnS', 'user'),
    ('View Only',   'viewer@finance.com', '$2a$10$njrMUOjC4qwSuN/xDG1gcurZAn2W/OPDDmZXWE/1yHGgJa211rCS.', 'read-only')
ON CONFLICT (email) DO NOTHING;

-- Categories --------------------------------------------------------------- --
INSERT INTO categories (name, type) VALUES
    ('Salary',        'income'),
    ('Freelance',     'income'),
    ('Investments',   'income'),
    ('Gifts',         'income'),
    ('Groceries',     'expense'),
    ('Rent',          'expense'),
    ('Utilities',     'expense'),
    ('Transport',     'expense'),
    ('Dining Out',    'expense'),
    ('Entertainment', 'expense'),
    ('Healthcare',    'expense'),
    ('Shopping',      'expense')
ON CONFLICT (name, type) DO NOTHING;

-- Sample transactions for the "Regular User" ------------------------------- --
-- Spread across several months so the analytics endpoints return rich trends.
INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date)
SELECT u.id, c.id, v.type::transaction_type, v.amount, v.description, v.tdate
FROM (VALUES
    ('Salary',        'income',  4500.00, 'Monthly salary',        DATE '2026-05-01'),
    ('Freelance',     'income',   800.00, 'Website project',       DATE '2026-05-12'),
    ('Groceries',     'expense',  320.50, 'May groceries',         DATE '2026-05-06'),
    ('Rent',          'expense', 1500.00, 'May rent',              DATE '2026-05-03'),
    ('Utilities',     'expense',  140.25, 'Electricity + water',   DATE '2026-05-09'),
    ('Dining Out',    'expense',   85.00, 'Dinner with friends',   DATE '2026-05-18'),

    ('Salary',        'income',  4500.00, 'Monthly salary',        DATE '2026-06-01'),
    ('Investments',   'income',   210.00, 'Dividend payout',       DATE '2026-06-15'),
    ('Groceries',     'expense',  298.75, 'June groceries',        DATE '2026-06-07'),
    ('Rent',          'expense', 1500.00, 'June rent',             DATE '2026-06-03'),
    ('Transport',     'expense',   60.00, 'Metro pass',            DATE '2026-06-04'),
    ('Entertainment', 'expense',  120.00, 'Concert tickets',       DATE '2026-06-22'),

    ('Salary',        'income',  4500.00, 'Monthly salary',        DATE '2026-07-01'),
    ('Freelance',     'income',  1200.00, 'Logo design',           DATE '2026-07-10'),
    ('Groceries',     'expense',  345.10, 'July groceries',        DATE '2026-07-05'),
    ('Rent',          'expense', 1500.00, 'July rent',             DATE '2026-07-03'),
    ('Healthcare',    'expense',  220.00, 'Dentist',               DATE '2026-07-14'),
    ('Shopping',      'expense',  180.90, 'New shoes',             DATE '2026-07-20')
) AS v(cat_name, type, amount, description, tdate)
JOIN categories c ON c.name = v.cat_name AND c.type = v.type::transaction_type
CROSS JOIN (SELECT id FROM users WHERE email = 'user@finance.com') AS u
WHERE NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = u.id
      AND t.description = v.description
      AND t.transaction_date = v.tdate
);
