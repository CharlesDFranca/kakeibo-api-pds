\set ON_ERROR_STOP on
\o /dev/null
\set s '\'2026-10-01\''
\set e '\'2026-10-31 23:59:59\''
\timing on
-- Q1 saldo + receitas + despesas do período
SELECT COALESCE(SUM(balance),0) FROM wallets WHERE "userId"='u1';
SELECT COALESCE(SUM(t.amount),0) FROM transactions t JOIN wallets w ON w.id=t."walletId" WHERE w."userId"='u1' AND t.type='INCOME' AND t.date>=:s AND t.date<=:e;
SELECT COALESCE(SUM(t.amount),0) FROM transactions t JOIN wallets w ON w.id=t."walletId" WHERE w."userId"='u1' AND t.type='EXPENSE' AND t.date>=:s AND t.date<=:e;
-- Q2 evolução: saldo inicial + diário
SELECT COALESCE(SUM(CASE WHEN t.type IN ('INCOME','OPENING_BALANCE') THEN t.amount WHEN t.type='EXPENSE' THEN -t.amount WHEN t.type='TRANSFER' AND t.direction='IN' THEN t.amount WHEN t.type='TRANSFER' AND t.direction='OUT' THEN -t.amount ELSE 0 END),0) FROM transactions t JOIN wallets w ON w.id=t."walletId" WHERE w."userId"='u1' AND t.date < :s;
SELECT DATE_TRUNC('day',t.date) d, SUM(CASE WHEN t.type='INCOME' THEN t.amount ELSE 0 END), SUM(CASE WHEN t.type='EXPENSE' THEN t.amount ELSE 0 END), SUM(CASE WHEN t.type IN ('INCOME','OPENING_BALANCE') THEN t.amount WHEN t.type='EXPENSE' THEN -t.amount WHEN t.type='TRANSFER' AND t.direction='IN' THEN t.amount WHEN t.type='TRANSFER' AND t.direction='OUT' THEN -t.amount ELSE 0 END) FROM transactions t JOIN wallets w ON w.id=t."walletId" WHERE w."userId"='u1' AND t.date>=:s AND t.date<=:e GROUP BY 1 ORDER BY 1;
-- Q3 despesas por categoria
SELECT c.id, c.name, SUM(t.amount) a FROM transactions t JOIN wallets w ON w.id=t."walletId" JOIN categories c ON c.id=t."categoryId" WHERE w."userId"='u1' AND t.type='EXPENSE' AND t.date>=:s AND t.date<=:e GROUP BY c.id,c.name ORDER BY a DESC;
-- Q4 últimas 5 transações
SELECT t.*, w.name, c.name FROM transactions t JOIN wallets w ON w.id=t."walletId" JOIN categories c ON c.id=t."categoryId" WHERE w."userId"='u1' ORDER BY t.date DESC, t.id DESC LIMIT 5;
-- Q5 listagem (período de 1 ano, sem filtro de tipo)
SELECT t.*, w.name, c.name FROM transactions t JOIN wallets w ON w.id=t."walletId" JOIN categories c ON c.id=t."categoryId" WHERE w."userId"='u1' AND t.date>=now()-interval '365 days' ORDER BY t.date DESC;
