# Benchmark do painel financeiro (RNF03: menos de 2 s)

Mede as consultas do `GET /finance/dashboard` direto no PostgreSQL 16, com
**980 mil transações** (um usuário com 200 mil transações em 3 anos e mais 39
usuários com 20 mil cada), antes e depois dos índices de `typeorm-transaction.entity.ts`.

Como repetir:

```bash
psql -f docs/benchmark/seed.sql      # cria um schema equivalente e popula
psql -f docs/benchmark/queries.sql   # \timing mostra o tempo de cada consulta
# depois crie os índices e rode queries.sql de novo:
#   CREATE INDEX ON transactions("walletId", date);
#   CREATE INDEX ON transactions("categoryId");
#   CREATE INDEX ON transactions(date);
```

Resultados (ms, uma execução, máquina de desenvolvimento):

| Consulta | Sem índices | Com índices |
|---|---:|---:|
| Saldo total das carteiras | 1,4 | 1,4 |
| Receitas do mês | 50,0 | 7,3 |
| Despesas do mês | 50,1 | 4,9 |
| Saldo inicial da evolução (histórico anterior ao período) | 74,2 | 70,3 |
| Evolução diária do mês | 55,3 | 7,7 |
| Despesas por categoria | 49,8 | 6,7 |
| Últimas 5 transações | 107,3 | 0,8 |
| Listagem de 1 ano | 181,1 | 110,9 |
| **Painel completo (as 7 primeiras consultas)** | **≈ 390** | **≈ 100** |

O painel fica bem abaixo de 2 s mesmo sem índices; os índices reduzem o tempo
em cerca de 4 vezes e mantêm o resultado estável com o crescimento dos dados.
A consulta mais pesada passa a ser o saldo inicial da evolução, que soma todo o
histórico anterior ao período (cresce linearmente com o histórico do usuário).
Se virar gargalo, o caminho é guardar saldos diários acumulados.

Limites: é um teste de consultas, não da API completa (sem rede, sem
serialização, sem Redis), e os dados são sintéticos.
