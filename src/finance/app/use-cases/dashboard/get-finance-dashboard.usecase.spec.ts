import { EPlan } from '@/shared/plans/plan.enum';
import { GetFinanceDashboardUseCase } from './get-finance-dashboard.usecase';
import { InvalidDateRangeError } from '@/finance/app/errors/invalid-date-range.error';
import type { IFinanceDashboardQuery } from '../../contracts/finance-dashboard-query.interface';

function makeQuery() {
    const calls: unknown[] = [];
    const categoryCalls: number[] = [];
    const query = {
        getBalance: (_u: string, f: unknown) => {
            calls.push(f);
            return Promise.resolve({ current: '0.00', income: '0.00', expenses: '0.00' });
        },
        getFinancialEvolution: () => Promise.resolve([]),
        getExpensesByCategory: () => {
            categoryCalls.push(1);
            return Promise.resolve([]);
        },
        getRecentTransactions: () => Promise.resolve([]),
    } as unknown as IFinanceDashboardQuery;

    return { query, calls, categoryCalls };
}

describe('GetFinanceDashboardUseCase – período (ECUS11)', () => {
    it('aceita período de um único dia (início igual ao fim)', async () => {
        const { query, calls } = makeQuery();
        const useCase = new GetFinanceDashboardUseCase(query);
        const day = new Date('2026-11-14T00:00:00.000Z');
        const end = new Date('2026-11-14T23:59:59.999Z');

        await useCase.execute({ userId: 'u', plan: EPlan.PRO, startDate: day, endDate: end });
        await useCase.execute({ userId: 'u', plan: EPlan.PRO, startDate: day, endDate: day });

        expect(calls.length).toBe(2);
    });

    it('rejeita início maior que o fim', async () => {
        const { query } = makeQuery();
        const useCase = new GetFinanceDashboardUseCase(query);

        await expect(
            useCase.execute({
                userId: 'u',
                plan: EPlan.PRO,
                startDate: new Date('2026-11-15'),
                endDate: new Date('2026-11-14'),
            }),
        ).rejects.toThrow(InvalidDateRangeError);
    });

    it('rejeita período com apenas uma das datas', async () => {
        const { query } = makeQuery();
        const useCase = new GetFinanceDashboardUseCase(query);

        await expect(
            useCase.execute({ userId: 'u', plan: EPlan.PRO, startDate: new Date('2026-11-14') }),
        ).rejects.toThrow(InvalidDateRangeError);
        await expect(
            useCase.execute({ userId: 'u', plan: EPlan.PRO, endDate: new Date('2026-11-14') }),
        ).rejects.toThrow(InvalidDateRangeError);
    });

    it('sem datas consulta o painel sem filtro', async () => {
        const { query, calls } = makeQuery();
        await new GetFinanceDashboardUseCase(query).execute({ userId: 'u', plan: EPlan.PRO });

        expect(calls[0]).toBeUndefined();
    });

    it('análise por categoria só é calculada em Plus e Pro (Tabela 28)', async () => {
        const free = makeQuery();
        const freeResult = await new GetFinanceDashboardUseCase(
            free.query,
        ).execute({ userId: 'u', plan: EPlan.FREE });

        expect(freeResult.expensesByCategory).toBe(null);
        expect(free.categoryCalls.length).toBe(0);

        for (const plan of [EPlan.PLUS, EPlan.PRO]) {
            const paid = makeQuery();
            const result = await new GetFinanceDashboardUseCase(
                paid.query,
            ).execute({ userId: 'u', plan });

            expect(result.expensesByCategory).toEqual([]);
            expect(paid.categoryCalls.length).toBe(1);
        }
    });
});
