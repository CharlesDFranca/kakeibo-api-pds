import { Inject, Injectable } from '@nestjs/common';
import { CORE_TOKENS } from '@/core/core.tokens';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import type { IFinanceUnitOfWork } from '@/finance/app/contracts/finance-unit-of-work.contract';
import {
    IFinanceFacade,
    WithdrawFromWalletInput,
    WithdrawFromWalletOutput,
    DepositToWalletInput,
    DepositToWalletOutput,
} from '../../api/finance-facade.api';
import { CategoryNotFoundError } from '../errors/category-not-found.error';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { WalletNotFoundError } from '../errors/wallet-not-found.error';
import { Transaction } from '@/finance/domain/entities/transaction.entity';
import { ETransactionDirection } from '@/finance/domain/enums/transaction-direction.enum';
import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import { BasicCategories } from '@/finance/domain/enums/basic-categories.enum';
import { Category } from '@/finance/domain/entities/category.entity';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { SystemCategory } from '@/finance/domain/enums/system-categories.enum';

@Injectable()
export class FinanceFacadeService implements IFinanceFacade {
    constructor(
        @Inject(FINANCE_TOKENS.UNIT_OF_WORK)
        private readonly financeUow: IFinanceUnitOfWork,
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
    ) {}

    async withdrawFromWallet(
        input: WithdrawFromWalletInput,
    ): Promise<WithdrawFromWalletOutput> {
        const walletRepo = this.financeUow.getWalletRepository();

        const wallet = await walletRepo.findUserWalletById(
            input.userId,
            input.walletId,
            { forUpdate: true },
        );
        if (!wallet) throw new WalletNotFoundError();

        wallet.withdraw(input.amount);

        const transaction = await this.createMovementTransaction(
            input.userId,
            wallet.id,
            input.amount,
            input.description,
            input.date,
            ETransactionDirection.OUT,
        );

        await walletRepo.update(wallet);
        await this.financeUow.getTransactionRepository().create(transaction);

        return { transactionId: transaction.id };
    }

    async depositToWallet(
        input: DepositToWalletInput,
    ): Promise<DepositToWalletOutput> {
        const walletRepo = this.financeUow.getWalletRepository();

        const wallet = await walletRepo.findUserWalletById(
            input.userId,
            input.walletId,
            { forUpdate: true },
        );
        if (!wallet) throw new WalletNotFoundError();

        wallet.deposit(input.amount);

        const transaction = await this.createMovementTransaction(
            input.userId,
            wallet.id,
            input.amount,
            input.description,
            input.date,
            ETransactionDirection.IN,
        );

        await walletRepo.update(wallet);
        await this.financeUow.getTransactionRepository().create(transaction);

        return { transactionId: transaction.id };
    }

    private async createMovementTransaction(
        userId: string,
        walletId: string,
        amount: Money,
        description: string,
        date: Date,
        direction: ETransactionDirection,
    ): Promise<Transaction> {
        const category = await this.financeUow
            .getCategoryRepository()
            .findSystemCategory(userId, SystemCategory.TRANSFER);

        if (!category) throw new CategoryNotFoundError();

        return Transaction.transferLeg(
            this.idGenerator.generate(),
            { amount, categoryId: category.id, walletId, description },
            direction,
            date,
        );
    }

    async createBasicCategories(userId: string): Promise<void> {
        const categoryRepo = this.financeUow.getCategoryRepository();
        const now = new Date();

        const categories = Object.values(BasicCategories).map(
            (name) =>
                new Category(
                    this.idGenerator.generate(),
                    {
                        userId,
                        name: new Name(name),
                        isSystem: false,
                        isActive: true,
                    },
                    now,
                    now,
                ),
        );

        await categoryRepo.createMany(categories);
    }

    async createSystemCategories(userId: string): Promise<void> {
        const categoryRepo = this.financeUow.getCategoryRepository();
        const now = new Date();

        const categories = Object.values(SystemCategory).map(
            (name) =>
                new Category(
                    this.idGenerator.generate(),
                    {
                        userId,
                        name: new Name(name),
                        isSystem: true,
                        isActive: true,
                    },
                    now,
                    now,
                ),
        );

        await categoryRepo.createMany(categories);
    }
}
