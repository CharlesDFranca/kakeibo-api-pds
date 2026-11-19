import {
    InMemoryFinanceUnitOfWork,
    SequentialIdGenerator,
    makeCategory,
    makeWallet,
} from '../../../testing/in-memory-finance';
import { RegisterTransactionUseCase } from './register-transaction.usecase';
import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';
import { InsufficientWalletBalanceError } from '@/finance/domain/errors/insufficient-wallet-balance.error';
import { TransactionTypeNotAllowedError } from '@/finance/domain/errors/transaction-type-not-allowed.error';
import { InMemoryEventBus } from '@/shared/events/in-memory-event-bus';
import { TransactionCreatedEvent } from '@/finance/domain/events/transaction-created.event';
import { CategoryNotFoundError } from '../../errors/category-not-found.error';

describe('RegisterTransactionUseCase', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let useCase: RegisterTransactionUseCase;
    let bus: InMemoryEventBus;

    const base = {
        userId: 'user-1',
        amount: '25.00',
        date: new Date(),
        walletId: 'w1',
        categoryId: 'c1',
    };

    beforeEach(async () => {
        uow = new InMemoryFinanceUnitOfWork();
        bus = new InMemoryEventBus();
        useCase = new RegisterTransactionUseCase(
            new SequentialIdGenerator(),
            uow,
            bus,
        );

        await uow.wallets.create(makeWallet('w1', '100.00'));
        await uow.categories.create(makeCategory('c1', 'Food'));
        await uow.categories.create(
            makeCategory('c-sys', 'transfer', { isSystem: true }),
        );
        await uow.categories.create(
            makeCategory('c-off', 'Antiga', { isActive: false }),
        );
    });

    it('receita aumenta o saldo e despesa reduz (US07)', async () => {
        await useCase.execute({ ...base, type: ETransactionType.INCOME });
        expect(uow.wallets.wallets.get('w1')?.balance.amount).toBe('125.00');

        await useCase.execute({ ...base, type: ETransactionType.EXPENSE });
        expect(uow.wallets.wallets.get('w1')?.balance.amount).toBe('100.00');
    });

    it('bloqueia a carteira durante o registro', async () => {
        await useCase.execute({ ...base, type: ETransactionType.EXPENSE });

        expect(uow.wallets.lockedIds).toEqual(['w1']);
    });

    it('despesa acima do saldo é recusada sem registrar nada (RN10)', async () => {
        await expect(
            useCase.execute({
                ...base,
                amount: '100.01',
                type: ETransactionType.EXPENSE,
            }),
        ).rejects.toThrow(InsufficientWalletBalanceError);

        expect(uow.transactions.transactions.size).toBe(0);
        expect(uow.wallets.wallets.get('w1')?.balance.amount).toBe('100.00');
    });

    it('aceita apenas receita e despesa', async () => {
        await expect(
            useCase.execute({ ...base, type: ETransactionType.TRANSFER }),
        ).rejects.toThrow(TransactionTypeNotAllowedError);
    });

    it('recusa categoria de sistema ou inativa', async () => {
        await expect(
            useCase.execute({
                ...base,
                categoryId: 'c-sys',
                type: ETransactionType.EXPENSE,
            }),
        ).rejects.toThrow(CategoryNotFoundError);

        await expect(
            useCase.execute({
                ...base,
                categoryId: 'c-off',
                type: ETransactionType.EXPENSE,
            }),
        ).rejects.toThrow(CategoryNotFoundError);
    });

    it('publica TransactionCreatedEvent depois de registrar (6.3.3)', async () => {
        const { id } = await useCase.execute({
            ...base,
            type: ETransactionType.EXPENSE,
        });

        expect(bus.published.length).toBe(1);
        const event = bus.published[0] as TransactionCreatedEvent;
        expect(event instanceof TransactionCreatedEvent).toBe(true);
        expect(event.transactionId).toBe(id);
        expect(event.userId).toBe('user-1');
        expect(event.amount).toBe('25.00');
        expect(event.type).toBe(ETransactionType.EXPENSE);
    });

    it('não publica evento quando o registro falha', async () => {
        await expect(
            useCase.execute({
                ...base,
                amount: '100.01',
                type: ETransactionType.EXPENSE,
            }),
        ).rejects.toThrow(InsufficientWalletBalanceError);

        expect(bus.published.length).toBe(0);
    });
});
