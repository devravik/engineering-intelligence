-- 20260926_add_phone.sql
-- Table has 1,500,000 existing records
ALTER TABLE users ADD COLUMN phone_number VARCHAR(25) NOT NULL;
