import {
    InMemoryFinanceUnitOfWork,
    makeWallet,
} from '../../../testing/in-memory-finance';
import { DeleteTransactionUseCase } from './delete-transaction.usecase';
import { Transaction } from '@/finance/domain/entities/transaction.entity';
import { TransactionType } from '@/finance/domain/value-objects/transaction-type.vo';
import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';
import { InsufficientWalletBalanceError } from '@/finance/domain/errors/insufficient-wallet-balance.error';
import { TransactionCannotBeDeletedError } from '@/finance/domain/errors/transaction-cannot-be-deleted.error';
import { Money } from '@/shared/domain/value-objects/money.vo';
import type { IFundsAllocationSource } from '../../contracts/funds-allocation.contract';
import { TransactionLinkedToGoalError } from '../../errors/transaction-linked-to-goal.error';
import { TransactionNotFoundError } from '../../errors/transaction-not-found.error';

function makeTransaction(
    id: string,
    type: ETransactionType,
    amount: string,
): Transaction {
    const now = new Date();
    return new Transaction(
        id,
        {
            description: '',
            amount: Money.fromAmount(amount),
            type: new TransactionType(type),
            date: now,
            walletId: 'w1',
            categoryId: 'c1',
        },
        now,
        now,
    );
}

describe('DeleteTransactionUseCase', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let linkedToGoal: boolean;
    let useCase: DeleteTransactionUseCase;

    beforeEach(async () => {
        uow = new InMemoryFinanceUnitOfWork();
        linkedToGoal = false;

        const fundsAllocation: IFundsAllocationSource = {
            isWalletAllocated: () => Promise.resolve(false),
            isTransactionAllocated: () => Promise.resolve(linkedToGoal),
        };

        useCase = new DeleteTransactionUseCase(uow, fundsAllocation);

        await uow.wallets.create(makeWallet('w1', '100.00'));
    });

    it('excluir uma despesa devolve o valor à carteira', async () => {
        await uow.transactions.create(
            makeTransaction('t1', ETransactionType.EXPENSE, '30.00'),
        );

        await useCase.execute({ userId: 'user-1', transactionId: 't1' });

        expect(uow.wallets.wallets.get('w1')?.balance.amount).toBe('130.00');
        expect(uow.transactions.transactions.has('t1')).toBe(false);
    });

    it('excluir uma receita retira o valor da carteira', async () => {
        await uow.transactions.create(
            makeTransaction('t2', ETransactionType.INCOME, '40.00'),
        );

        await useCase.execute({ userId: 'user-1', transactionId: 't2' });

        expect(uow.wallets.wallets.get('w1')?.balance.amount).toBe('60.00');
    });

    it('bloqueia a carteira antes de ajustar o saldo', async () => {
        await uow.transactions.create(
            makeTransaction('t3', ETransactionType.EXPENSE, '10.00'),
        );

        await useCase.execute({ userId: 'user-1', transactionId: 't3' });

        expect(uow.wallets.lockedIds).toEqual(['w1']);
    });

    it('não ajusta o saldo duas vezes se a transação sumiu durante o lock', async () => {
        await uow.transactions.create(
            makeTransaction('t4', ETransactionType.EXPENSE, '10.00'),
        );

        // Simula outra exclusão concluída entre a primeira leitura e o lock.
        let reads = 0;
        uow.transactions.onFind = () => {
            reads += 1;
            if (reads === 2) uow.transactions.transactions.delete('t4');
        };

        await expect(
            useCase.execute({ userId: 'user-1', transactionId: 't4' }),
        ).rejects.toThrow(TransactionNotFoundError);

        expect(uow.wallets.wallets.get('w1')?.balance.amount).toBe('100.00');
    });

    it('não exclui transação vinculada a meta (RN03)', async () => {
        await uow.transactions.create(
            makeTransaction('t5', ETransactionType.TRANSFER, '10.00'),
        );
        linkedToGoal = true;

        await expect(
            useCase.execute({ userId: 'user-1', transactionId: 't5' }),
        ).rejects.toThrow(TransactionLinkedToGoalError);
    });

    it('não exclui transferência, saldo inicial ou ajuste', async () => {
        await uow.transactions.create(
            makeTransaction('t6', ETransactionType.TRANSFER, '10.00'),
        );

        await expect(
            useCase.execute({ userId: 'user-1', transactionId: 't6' }),
        ).rejects.toThrow(TransactionCannotBeDeletedError);
    });

    it('não exclui receita que deixaria o saldo negativo (RN15)', async () => {
        await uow.transactions.create(
            makeTransaction('t7', ETransactionType.INCOME, '150.00'),
        );

        await expect(
            useCase.execute({ userId: 'user-1', transactionId: 't7' }),
        ).rejects.toThrow(InsufficientWalletBalanceError);

        expect(uow.transactions.transactions.has('t7')).toBe(true);
    });
});
