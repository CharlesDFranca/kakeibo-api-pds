import {
    InMemoryFinanceUnitOfWork,
    SequentialIdGenerator,
    makeCategory,
    makeWallet,
} from '../../testing/in-memory-finance';
import { FinanceFacadeService } from './finance-facade.service';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { ETransactionDirection } from '@/finance/domain/enums/transaction-direction.enum';
import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';

describe('FinanceFacadeService (movimentações de meta)', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let facade: FinanceFacadeService;

    beforeEach(async () => {
        uow = new InMemoryFinanceUnitOfWork();
        facade = new FinanceFacadeService(uow, new SequentialIdGenerator());

        await uow.wallets.create(makeWallet('w-1', '50.00'));
        await uow.categories.create(
            makeCategory('cat-transfer', 'transfer', { isSystem: true }),
        );
    });

    it('retirada para a meta gera movimentação TRANSFER de saída', async () => {
        const { transactionId } = await facade.withdrawFromWallet({
            userId: 'user-1',
            walletId: 'w-1',
            amount: Money.fromAmount('20.00'),
            description: 'Aporte',
            date: new Date(),
        });

        const tx = uow.transactions.transactions.get(transactionId);

        expect(tx?.type.value()).toBe(ETransactionType.TRANSFER);
        expect(tx?.direction).toBe(ETransactionDirection.OUT);
        expect(uow.wallets.wallets.get('w-1')?.balance.amount).toBe('30.00');
    });

    it('devolução da meta gera movimentação TRANSFER de entrada', async () => {
        const { transactionId } = await facade.depositToWallet({
            userId: 'user-1',
            walletId: 'w-1',
            amount: Money.fromAmount('5.00'),
            description: 'Estorno de aporte',
            date: new Date(),
        });

        const tx = uow.transactions.transactions.get(transactionId);

        expect(tx?.direction).toBe(ETransactionDirection.IN);
        expect(uow.wallets.wallets.get('w-1')?.balance.amount).toBe('55.00');
    });
});
