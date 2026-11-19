\set ON_ERROR_STOP on
\timing off
DROP TABLE IF EXISTS transactions, categories, wallets CASCADE;
DROP TYPE IF EXISTS tx_type, tx_dir;
CREATE TYPE tx_type AS ENUM ('INCOME','EXPENSE','TRANSFER','OPENING_BALANCE','ADJUSTMENT');
CREATE TYPE tx_dir AS ENUM ('IN','OUT');
CREATE TABLE wallets (id varchar primary key, name varchar, "normalizedName" varchar, balance int, "userId" varchar, UNIQUE("userId","normalizedName"));
CREATE TABLE categories (id varchar primary key, name varchar, "userId" varchar, UNIQUE("userId", name));
CREATE TABLE transactions (id varchar primary key, description varchar, amount int, type tx_type, direction tx_dir, date timestamptz, "walletId" varchar references wallets(id), "categoryId" varchar references categories(id));
-- 40 usuários, 4 carteiras e 12 categorias cada
INSERT INTO wallets SELECT 'w'||u||'_'||w, 'W'||w, 'w'||w, 100000, 'u'||u FROM generate_series(1,40) u, generate_series(1,4) w;
INSERT INTO categories SELECT 'c'||u||'_'||c, 'C'||c, 'u'||u FROM generate_series(1,40) u, generate_series(1,12) c;
-- usuário u1: 200k transações em 3 anos; demais: 20k cada
INSERT INTO transactions
SELECT 't1_'||g, 'x', (random()*50000+100)::int,
  (ARRAY['INCOME','EXPENSE','EXPENSE','EXPENSE','TRANSFER']::tx_type[])[1+(random()*4)::int],
  NULL, now() - (random()*1095||' days')::interval, 'w1_'||(1+(random()*3)::int), 'c1_'||(1+(random()*11)::int)
FROM generate_series(1,200000) g;
UPDATE transactions SET direction = (ARRAY['IN','OUT']::tx_dir[])[1+(random())::int] WHERE type='TRANSFER';
INSERT INTO transactions
SELECT 't'||u||'_'||g, 'x', (random()*50000+100)::int,
  (ARRAY['INCOME','EXPENSE','EXPENSE','EXPENSE','TRANSFER']::tx_type[])[1+(random()*4)::int],
  NULL, now() - (random()*1095||' days')::interval, 'w'||u||'_'||(1+(random()*3)::int), 'c'||u||'_'||(1+(random()*11)::int)
FROM generate_series(2,40) u, generate_series(1,20000) g;
ANALYZE;
