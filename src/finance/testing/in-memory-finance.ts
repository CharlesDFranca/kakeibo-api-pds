import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import type { IFinanceUnitOfWork } from '@/finance/app/contracts/finance-unit-of-work.contract';
import { Category } from '@/finance/domain/entities/category.entity';
import { Transaction } from '@/finance/domain/entities/transaction.entity';
import { Transfer } from '@/finance/domain/entities/transfer.entity';
import { Wallet } from '@/finance/domain/entities/wallet.entity';
import { SystemCategory } from '@/finance/domain/enums/system-categories.enum';
import type { ICategoryRepository } from '@/finance/domain/repositories/category-repository.interface';
import type { ITransactionRepository } from '@/finance/domain/repositories/transaction-repository.interface';
import type { ITransferRepository } from '@/finance/domain/repositories/transfer-repository.interface';
import type { IWalletRepository } from '@/finance/domain/repositories/wallet-repository.interface';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { Money } from '@/shared/domain/value-objects/money.vo';

/**
 * Dublês em memória usados apenas nos testes unitários dos casos de uso
 * (sem banco de dados).
 */

export class SequentialIdGenerator implements IIDGenerator {
    private counter = 0;

    generate(): string {
        this.counter += 1;
        return `id-${this.counter}`;
    }
}

export class InMemoryWalletRepository implements IWalletRepository {
    public readonly wallets = new Map<string, Wallet>();

    /** Ordem em que as carteiras foram lidas com `forUpdate` (lock). */
    public readonly lockedIds: string[] = [];

    create(wallet: Wallet): Promise<void> {
        this.wallets.set(wallet.id, wallet);
        return Promise.resolve();
    }

    update(wallet: Wallet): Promise<void> {
        this.wallets.set(wallet.id, wallet);
        return Promise.resolve();
    }

    findAllForUser(userId: string): Promise<Wallet[]> {
        return Promise.resolve(
            [...this.wallets.values()].filter((w) => w.userId === userId),
        );
    }

    findUserWalletByName(userId: string, name: string): Promise<Wallet | null> {
        const wallet = [...this.wallets.values()].find(
            (w) => w.userId === userId && w.name.value === name,
        );
        return Promise.resolve(wallet ?? null);
    }

    findUserWalletById(
        userId: string,
        walletId: string,
        options?: { forUpdate?: boolean },
    ): Promise<Wallet | null> {
        const wallet = this.wallets.get(walletId);

        if (!wallet || wallet.userId !== userId) return Promise.resolve(null);

        if (options?.forUpdate) this.lockedIds.push(walletId);

        return Promise.resolve(wallet);
    }

    deleteUserWallet(userId: string, walletId: string): Promise<void> {
        const wallet = this.wallets.get(walletId);
        if (wallet && wallet.userId === userId) this.wallets.delete(walletId);
        return Promise.resolve();
    }
}

export class InMemoryTransactionRepository implements ITransactionRepository {
    public readonly transactions = new Map<string, Transaction>();

    /** Simula uma exclusão concorrente ocorrida durante a espera do lock. */
    public onFind?: () => void;

    create(transaction: Transaction): Promise<void> {
        this.transactions.set(transaction.id, transaction);
        return Promise.resolve();
    }

    update(transaction: Transaction): Promise<void> {
        this.transactions.set(transaction.id, transaction);
        return Promise.resolve();
    }

    delete(id: string): Promise<void> {
        this.transactions.delete(id);
        return Promise.resolve();
    }

    findUserTransactionById(
        userId: string,
        transactionId: string,
    ): Promise<Transaction | null> {
        this.onFind?.();
        return Promise.resolve(this.transactions.get(transactionId) ?? null);
    }

    findAllForUser(): Promise<Transaction[]> {
        return Promise.resolve([...this.transactions.values()]);
    }

    existsUserTransactionByCategoryId(
        userId: string,
        categoryId: string,
    ): Promise<boolean> {
        return Promise.resolve(
            [...this.transactions.values()].some(
                (t) => t.categoryId === categoryId,
            ),
        );
    }
}

export class InMemoryTransferRepository implements ITransferRepository {
    public readonly transfers = new Map<string, Transfer>();

    create(transfer: Transfer): Promise<void> {
        this.transfers.set(transfer.id, transfer);
        return Promise.resolve();
    }

    update(transfer: Transfer): Promise<void> {
        this.transfers.set(transfer.id, transfer);
        return Promise.resolve();
    }

    findUserTransferById(
        userId: string,
        transferId: string,
    ): Promise<Transfer | null> {
        return Promise.resolve(this.transfers.get(transferId) ?? null);
    }
}

export class InMemoryCategoryRepository implements ICategoryRepository {
    public readonly categories = new Map<string, Category>();

    create(category: Category): Promise<void> {
        this.categories.set(category.id, category);
        return Promise.resolve();
    }

    createMany(categories: Category[]): Promise<void> {
        categories.forEach((c) => this.categories.set(c.id, c));
        return Promise.resolve();
    }

    update(category: Category): Promise<void> {
        this.categories.set(category.id, category);
        return Promise.resolve();
    }

    findAllForUser(userId: string): Promise<Category[]> {
        return Promise.resolve(
            [...this.categories.values()].filter(
                (c) => c.userId === userId && !c.isSystem && c.isActive,
            ),
        );
    }

    findSystemCategory(
        userId: string,
        category: SystemCategory,
    ): Promise<Category | null> {
        const found = [...this.categories.values()].find(
            (c) =>
                c.userId === userId && c.isSystem && c.name.value === category,
        );
        return Promise.resolve(found ?? null);
    }

    findUserCategoryByName(
        userId: string,
        name: string,
    ): Promise<Category | null> {
        const found = [...this.categories.values()].find(
            (c) => c.userId === userId && c.name.value === name,
        );
        return Promise.resolve(found ?? null);
    }

    findUserCategoryById(
        userId: string,
        categoryId: string,
    ): Promise<Category | null> {
        const found = this.categories.get(categoryId);
        return Promise.resolve(found && found.userId === userId ? found : null);
    }

    deleteUserCategory(userId: string, categoryId: string): Promise<void> {
        this.categories.delete(categoryId);
        return Promise.resolve();
    }
}

export class InMemoryFinanceUnitOfWork implements IFinanceUnitOfWork {
    public readonly wallets = new InMemoryWalletRepository();
    public readonly transactions = new InMemoryTransactionRepository();
    public readonly categories = new InMemoryCategoryRepository();
    public readonly transfers = new InMemoryTransferRepository();

    /** Quantas vezes `transaction()` foi chamada. */
    public transactionCalls = 0;

    transaction<T>(work: () => Promise<T>): Promise<T> {
        this.transactionCalls += 1;
        return work();
    }

    getWalletRepository(): IWalletRepository {
        return this.wallets;
    }

    getTransactionRepository(): ITransactionRepository {
        return this.transactions;
    }

    getCategoryRepository(): ICategoryRepository {
        return this.categories;
    }

    getTransferRepository(): ITransferRepository {
        return this.transfers;
    }
}

export function makeWallet(
    id: string,
    balance: string,
    userId = 'user-1',
): Wallet {
    const now = new Date();
    return new Wallet(
        id,
        {
            userId,
            name: new Name(`Carteira ${id}`),
            balance: Money.fromAmount(balance),
        },
        now,
        now,
    );
}

export function makeCategory(
    id: string,
    name: string,
    options: { isSystem?: boolean; isActive?: boolean; userId?: string } = {},
): Category {
    const now = new Date();
    return new Category(
        id,
        {
            userId: options.userId ?? 'user-1',
            name: new Name(name),
            isSystem: options.isSystem ?? false,
            isActive: options.isActive ?? true,
        },
        now,
        now,
    );
}
