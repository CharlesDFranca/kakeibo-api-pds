import {
    InMemoryFinanceUnitOfWork,
    SequentialIdGenerator,
    makeCategory,
    makeWallet,
} from '../../../testing/in-memory-finance';
import { TransferFundsUseCase } from './transfer-funds.usecase';
import { ETransactionDirection } from '@/finance/domain/enums/transaction-direction.enum';
import { ETransferStatus } from '@/finance/domain/enums/transfer-status.enum';
import { CannotTransferToSameWalletError } from '@/finance/domain/errors/cannot-transfer-to-same-wallet.error';
import { InsufficientWalletBalanceError } from '@/finance/domain/errors/insufficient-wallet-balance.error';
import { WalletNotFoundError } from '../../errors/wallet-not-found.error';

describe('TransferFundsUseCase', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let useCase: TransferFundsUseCase;

    beforeEach(async () => {
        uow = new InMemoryFinanceUnitOfWork();
        useCase = new TransferFundsUseCase(new SequentialIdGenerator(), uow);

        await uow.wallets.create(makeWallet('w-b', '100.00'));
        await uow.wallets.create(makeWallet('w-a', '5.00'));
        await uow.categories.create(
            makeCategory('cat-transfer', 'transfer', { isSystem: true }),
        );
    });

    it('debita a origem, credita o destino e registra a transferência', async () => {
        const { id } = await useCase.execute({
            userId: 'user-1',
            amount: '40.00',
            sourceWalletId: 'w-b',
            destinationWalletId: 'w-a',
        });

        expect(uow.wallets.wallets.get('w-b')?.balance.amount).toBe('60.00');
        expect(uow.wallets.wallets.get('w-a')?.balance.amount).toBe('45.00');
        expect(uow.transfers.transfers.get(id)?.status).toBe(
            ETransferStatus.COMPLETED,
        );
        expect(uow.transactions.transactions.size).toBe(2);
    });

    it('registra o sentido das movimentações: saída na origem e entrada no destino', async () => {
        await useCase.execute({
            userId: 'user-1',
            amount: '10.00',
            sourceWalletId: 'w-b',
            destinationWalletId: 'w-a',
        });

        const legs = [...uow.transactions.transactions.values()];
        const out = legs.find((t) => t.walletId === 'w-b');
        const into = legs.find((t) => t.walletId === 'w-a');

        expect(out?.direction).toBe(ETransactionDirection.OUT);
        expect(into?.direction).toBe(ETransactionDirection.IN);
    });

    it('bloqueia as carteiras em ordem fixa, independente do sentido', async () => {
        await useCase.execute({
            userId: 'user-1',
            amount: '1.00',
            sourceWalletId: 'w-b',
            destinationWalletId: 'w-a',
        });

        expect(uow.wallets.lockedIds).toEqual(['w-a', 'w-b']);
    });

    it('rejeita carteiras iguais', async () => {
        await expect(
            useCase.execute({
                userId: 'user-1',
                amount: '1.00',
                sourceWalletId: 'w-a',
                destinationWalletId: 'w-a',
            }),
        ).rejects.toThrow(CannotTransferToSameWalletError);
    });

    it('rejeita saldo insuficiente sem alterar os saldos (RN10)', async () => {
        await expect(
            useCase.execute({
                userId: 'user-1',
                amount: '5.01',
                sourceWalletId: 'w-a',
                destinationWalletId: 'w-b',
            }),
        ).rejects.toThrow(InsufficientWalletBalanceError);

        expect(uow.wallets.wallets.get('w-a')?.balance.amount).toBe('5.00');
        expect(uow.wallets.wallets.get('w-b')?.balance.amount).toBe('100.00');
    });

    it('rejeita carteira de outro usuário', async () => {
        await expect(
            useCase.execute({
                userId: 'intruso',
                amount: '1.00',
                sourceWalletId: 'w-a',
                destinationWalletId: 'w-b',
            }),
        ).rejects.toThrow(WalletNotFoundError);
    });
});
