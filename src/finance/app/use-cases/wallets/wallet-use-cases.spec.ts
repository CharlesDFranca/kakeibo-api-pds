import {
    InMemoryFinanceUnitOfWork,
    SequentialIdGenerator,
    makeCategory,
    makeWallet,
} from '../../../testing/in-memory-finance';
import { CreateWalletUseCase } from './create-wallet.usecase';
import { RenameWalletUseCase } from './rename-wallet.usecase';
import { DeleteWalletUseCase } from './delete-wallet.usecase';
import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';
import { WalletAlreadyExistsError } from '../../errors/wallet-already-exists.error';
import { WalletNotFoundError } from '../../errors/wallet-not-found.error';
import { CategoryNotFoundError } from '../../errors/category-not-found.error';
import { WalletHasAllocatedMoneyError } from '@/finance/domain/errors/wallet-has-allocated-money.error';
import { MoneyValueCannotBeNegativeError } from '@/shared/domain/errors/money-value-cannot-be-negative.error';
import { MoneyCannotHaveMoreThanTwoDecimalPlacesError } from '@/shared/domain/errors/money-cannot-have-more-than-two-decimal-place.error';

describe('CreateWalletUseCase (US01)', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let useCase: CreateWalletUseCase;

    beforeEach(async () => {
        uow = new InMemoryFinanceUnitOfWork();
        useCase = new CreateWalletUseCase(new SequentialIdGenerator(), uow);
        await uow.categories.create(
            makeCategory('cat-opening', 'opening balance', { isSystem: true }),
        );
    });

    it('cria a carteira e registra o saldo inicial como transação', async () => {
        const { id } = await useCase.execute({
            userId: 'user-1',
            name: 'Nubank',
            balance: '150.50',
        });

        expect(uow.wallets.wallets.get(id)?.balance.amount).toBe('150.50');

        const [tx] = [...uow.transactions.transactions.values()];
        expect(tx?.type.value()).toBe(ETransactionType.OPENING_BALANCE);
        expect(tx?.walletId).toBe(id);
        expect(tx?.amount.amount).toBe('150.50');
    });

    it('aceita saldo inicial zero', async () => {
        const { id } = await useCase.execute({
            userId: 'user-1',
            name: 'Cofre',
            balance: '0.00',
        });

        expect(uow.wallets.wallets.get(id)?.balance.amount).toBe('0.00');
    });

    it('rejeita saldo inicial negativo (RN15)', async () => {
        await expect(
            useCase.execute({ userId: 'user-1', name: 'A', balance: '-1.00' }),
        ).rejects.toThrow(MoneyValueCannotBeNegativeError);
    });

    it('rejeita mais de duas casas decimais (RN14)', async () => {
        await expect(
            useCase.execute({ userId: 'user-1', name: 'A', balance: '1.005' }),
        ).rejects.toThrow(MoneyCannotHaveMoreThanTwoDecimalPlacesError);
    });

    it('rejeita nome já usado pelo mesmo usuário, mas aceita em outro usuário', async () => {
        await useCase.execute({ userId: 'user-1', name: 'Nubank', balance: '1.00' });

        await expect(
            useCase.execute({ userId: 'user-1', name: 'Nubank', balance: '1.00' }),
        ).rejects.toThrow(WalletAlreadyExistsError);

        await uow.categories.create(
            makeCategory('cat-opening-2', 'opening balance', {
                isSystem: true,
                userId: 'user-2',
            }),
        );
        const other = await useCase.execute({
            userId: 'user-2',
            name: 'Nubank',
            balance: '1.00',
        });
        expect(other.id.length > 0).toBe(true);
    });

    it('falha sem a categoria de sistema de saldo inicial', async () => {
        uow.categories.categories.clear();

        await expect(
            useCase.execute({ userId: 'user-1', name: 'A', balance: '1.00' }),
        ).rejects.toThrow(CategoryNotFoundError);
    });
});

describe('RenameWalletUseCase (US03)', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let useCase: RenameWalletUseCase;

    beforeEach(async () => {
        uow = new InMemoryFinanceUnitOfWork();
        useCase = new RenameWalletUseCase(uow.wallets);
        await uow.wallets.create(makeWallet('w1', '10.00'));
        await uow.wallets.create(makeWallet('w2', '10.00'));
    });

    it('renomeia a carteira', async () => {
        await useCase.execute({ userId: 'user-1', walletId: 'w1', name: 'Reserva' });

        expect(uow.wallets.wallets.get('w1')?.name.value).toBe('Reserva');
    });

    it('rejeita nome de outra carteira do usuário', async () => {
        await expect(
            useCase.execute({ userId: 'user-1', walletId: 'w1', name: 'Carteira w2' }),
        ).rejects.toThrow(WalletAlreadyExistsError);
    });

    it('aceita manter o mesmo nome', async () => {
        await useCase.execute({ userId: 'user-1', walletId: 'w1', name: 'Carteira w1' });

        expect(uow.wallets.wallets.get('w1')?.name.value).toBe('Carteira w1');
    });

    it('carteira inexistente ou de outro usuário', async () => {
        await expect(
            useCase.execute({ userId: 'user-9', walletId: 'w1', name: 'X' }),
        ).rejects.toThrow(WalletNotFoundError);
    });
});

describe('DeleteWalletUseCase (US04 / RN06)', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let allocated: boolean;
    let useCase: DeleteWalletUseCase;

    beforeEach(async () => {
        allocated = false;
        uow = new InMemoryFinanceUnitOfWork();
        useCase = new DeleteWalletUseCase(uow.wallets, {
            ensureCanDelete: () => {
                if (allocated) throw new WalletHasAllocatedMoneyError();
                return Promise.resolve();
            },
        });
        await uow.wallets.create(makeWallet('w1', '10.00'));
    });

    it('exclui a carteira', async () => {
        await useCase.execute({ userId: 'user-1', walletId: 'w1' });

        expect(uow.wallets.wallets.has('w1')).toBe(false);
    });

    it('bloqueia a exclusão quando há valor alocado em metas (RN06)', async () => {
        allocated = true;

        await expect(
            useCase.execute({ userId: 'user-1', walletId: 'w1' }),
        ).rejects.toThrow(WalletHasAllocatedMoneyError);
        expect(uow.wallets.wallets.has('w1')).toBe(true);
    });

    it('carteira inexistente', async () => {
        await expect(
            useCase.execute({ userId: 'user-1', walletId: 'nope' }),
        ).rejects.toThrow(WalletNotFoundError);
    });
});
