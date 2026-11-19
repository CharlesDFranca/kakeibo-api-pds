import {
    InMemoryFinanceUnitOfWork,
    SequentialIdGenerator,
    makeCategory,
    makeWallet,
} from '../../../testing/in-memory-finance';
import { TransferFundsUseCase } from './transfer-funds.usecase';
import { RevertTransferUseCase } from './revert-transfer.usecase';
import { ETransactionDirection } from '@/finance/domain/enums/transaction-direction.enum';
import { ETransferStatus } from '@/finance/domain/enums/transfer-status.enum';
import { TransferCannotBeRevertedError } from '@/finance/domain/errors/transfer-cannot-be-reverted.error';
import { InsufficientWalletBalanceError } from '@/finance/domain/errors/insufficient-wallet-balance.error';
import { TransferNotFoundError } from '../../errors/transfer-not-found.error';

describe('RevertTransferUseCase', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let transferFunds: TransferFundsUseCase;
    let revert: RevertTransferUseCase;
    let transferId: string;

    beforeEach(async () => {
        uow = new InMemoryFinanceUnitOfWork();
        const ids = new SequentialIdGenerator();
        transferFunds = new TransferFundsUseCase(ids, uow);
        revert = new RevertTransferUseCase(ids, uow);

        await uow.wallets.create(makeWallet('w-a', '100.00'));
        await uow.wallets.create(makeWallet('w-b', '0.00'));
        await uow.categories.create(
            makeCategory('cat-transfer', 'transfer', { isSystem: true }),
        );

        ({ id: transferId } = await transferFunds.execute({
            userId: 'user-1',
            amount: '30.00',
            sourceWalletId: 'w-a',
            destinationWalletId: 'w-b',
        }));
        uow.wallets.lockedIds.length = 0;
    });

    it('devolve o valor à origem e marca a transferência como estornada', async () => {
        await revert.execute({ userId: 'user-1', transferId });

        expect(uow.wallets.wallets.get('w-a')?.balance.amount).toBe('100.00');
        expect(uow.wallets.wallets.get('w-b')?.balance.amount).toBe('0.00');
        expect(uow.transfers.transfers.get(transferId)?.status).toBe(
            ETransferStatus.REVERTED,
        );
    });

    it('bloqueia as carteiras em ordem fixa', async () => {
        await revert.execute({ userId: 'user-1', transferId });

        expect(uow.wallets.lockedIds).toEqual(['w-a', 'w-b']);
    });

    it('bloqueia um segundo estorno da mesma transferência (RN13 / US10)', async () => {
        await revert.execute({ userId: 'user-1', transferId });

        await expect(
            revert.execute({ userId: 'user-1', transferId }),
        ).rejects.toThrow(TransferCannotBeRevertedError);

        expect(uow.wallets.wallets.get('w-a')?.balance.amount).toBe('100.00');
    });

    it('não estorna quando o destino não tem saldo suficiente (RN15)', async () => {
        const destination = uow.wallets.wallets.get('w-b');
        destination?.withdraw(destination.balance);

        await expect(
            revert.execute({ userId: 'user-1', transferId }),
        ).rejects.toThrow(InsufficientWalletBalanceError);
    });

    it('retorna erro para transferência inexistente', async () => {
        await expect(
            revert.execute({ userId: 'user-1', transferId: 'nao-existe' }),
        ).rejects.toThrow(TransferNotFoundError);
    });

    it('as movimentações do estorno anulam as da transferência (sentido invertido)', async () => {
        await revert.execute({ userId: 'user-1', transferId });

        const legs = [...uow.transactions.transactions.values()];
        const net = new Map<string, number>();

        for (const t of legs) {
            const sign = t.direction === ETransactionDirection.IN ? 1 : -1;
            net.set(
                t.walletId,
                (net.get(t.walletId) ?? 0) + sign * t.amount.toCents(),
            );
        }

        expect([...net.values()].every((v) => v === 0)).toBe(true);
    });
});
