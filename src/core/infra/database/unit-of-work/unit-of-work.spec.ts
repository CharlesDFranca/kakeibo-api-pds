import { BaseTypeOrmUnitOfWork } from './base-typeorm-unit-of-work';
import { TransactionContext } from './transaction-context';

/**
 * Prova a atomicidade entre contextos (RNF02): repositórios de módulos
 * diferentes (Finance e Planning) enxergam o MESMO EntityManager dentro de
 * uma `transaction()`, então um erro desfaz tudo junto.
 */

type FakeManager = { name: string };

function fakeDataSource() {
    const events: string[] = [];
    let seq = 0;
    const defaultManager: FakeManager = { name: 'default' };

    const dataSource = {
        manager: defaultManager,
        createQueryRunner() {
            const manager: FakeManager = { name: `tx-${++seq}` };
            return {
                manager,
                connect: async () => { events.push(`${manager.name}:connect`); },
                startTransaction: async () => { events.push(`${manager.name}:begin`); },
                commitTransaction: async () => { events.push(`${manager.name}:commit`); },
                rollbackTransaction: async () => { events.push(`${manager.name}:rollback`); },
                release: async () => { events.push(`${manager.name}:release`); },
            };
        },
    };

    return { dataSource, defaultManager, events };
}

// Duas UoWs de "contextos" diferentes, como TypeOrmFinanceUnitOfWork e TypeOrmPlanningUnitOfWork.
class FinanceUow extends BaseTypeOrmUnitOfWork {
    managerSeen(fallback: FakeManager) {
        return TransactionContext.getManager(fallback as never) as unknown as FakeManager;
    }
}
class PlanningUow extends BaseTypeOrmUnitOfWork {}

describe('Unit of Work compartilhada entre contextos', () => {
    it('fora de uma transação, usa o manager padrão', () => {
        const { defaultManager } = fakeDataSource();

        expect(TransactionContext.getManager(defaultManager as never) === (defaultManager as never)).toBe(true);
    });

    it('a UoW do Finance chamada dentro da transação do Planning usa a mesma transação', async () => {
        const { dataSource } = fakeDataSource();
        const planning = new PlanningUow(dataSource as never);
        const finance = new FinanceUow(dataSource as never);

        const seen = await planning.transaction(async () => finance.managerSeen(dataSource.manager));

        expect(seen.name).toBe('tx-1'); // o manager da transação, não o padrão
    });

    it('um erro depois do passo do Finance faz rollback de tudo e relança', async () => {
        const { dataSource, events } = fakeDataSource();
        const planning = new PlanningUow(dataSource as never);
        const finance = new FinanceUow(dataSource as never);

        await expect(
            planning.transaction(async () => {
                finance.managerSeen(dataSource.manager); // passo do Finance (débito da carteira)
                throw new Error('falha ao gravar a movimentação da meta');
            }),
        ).rejects.toThrow('falha ao gravar a movimentação da meta');

        expect(events).toEqual(['tx-1:connect', 'tx-1:begin', 'tx-1:rollback', 'tx-1:release']);
    });

    it('sucesso faz commit uma única vez', async () => {
        const { dataSource, events } = fakeDataSource();

        await new PlanningUow(dataSource as never).transaction(async () => 'ok');

        expect(events).toEqual(['tx-1:connect', 'tx-1:begin', 'tx-1:commit', 'tx-1:release']);
    });

    it('transações concorrentes não misturam os managers', async () => {
        const { dataSource } = fakeDataSource();
        const planning = new PlanningUow(dataSource as never);
        const finance = new FinanceUow(dataSource as never);
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

        const [a, b] = await Promise.all([
            planning.transaction(async () => {
                await wait(15);
                return finance.managerSeen(dataSource.manager).name;
            }),
            planning.transaction(async () => {
                await wait(1);
                return finance.managerSeen(dataSource.manager).name;
            }),
        ]);

        expect(a).toBe('tx-1');
        expect(b).toBe('tx-2');
    });
});
