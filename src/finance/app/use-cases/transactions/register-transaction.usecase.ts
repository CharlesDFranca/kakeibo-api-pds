import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import { Inject, Injectable } from '@nestjs/common';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { CORE_TOKENS } from '@/core/core.tokens';
import { Transaction } from '@/finance/domain/entities/transaction.entity';
import { TransactionType } from '@/finance/domain/value-objects/transaction-type.vo';
import type { IFinanceUnitOfWork } from '../../contracts/finance-unit-of-work.contract';
import { CategoryNotFoundError } from '../../errors/category-not-found.error';
import { WalletNotFoundError } from '../../errors/wallet-not-found.error';
import type { IEventBus } from '@/shared/events/event-bus.contract';
import { TransactionCreatedEvent } from '@/finance/domain/events/transaction-created.event';
import { TransactionTypeNotAllowedError } from '@/finance/domain/errors/transaction-type-not-allowed.error';

type CreateTransactionInput = {
    userId: string;
    description?: string | undefined;
    amount: string;
    type: ETransactionType;
    date: Date;
    walletId: string;
    categoryId: string;
};

type CreateTransactionOutput = {
    id: string;
};

@Injectable()
export class RegisterTransactionUseCase implements IBaseUseCase<
    CreateTransactionInput,
    CreateTransactionOutput
> {
    constructor(
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
        @Inject(FINANCE_TOKENS.UNIT_OF_WORK)
        private readonly financeUow: IFinanceUnitOfWork,
        @Inject(CORE_TOKENS.EVENT_BUS)
        private readonly eventBus: IEventBus,
    ) {}

    async execute(
        input: CreateTransactionInput,
    ): Promise<CreateTransactionOutput> {
        const type = new TransactionType(input.type);

        if (!type.isIncome() && !type.isExpense()) {
            throw new TransactionTypeNotAllowedError();
        }

        const transaction = await this.financeUow.transaction(async () => {
            const categoryRepository = this.financeUow.getCategoryRepository();
            const walletRepository = this.financeUow.getWalletRepository();
            const transactionRepository =
                this.financeUow.getTransactionRepository();

            const category = await categoryRepository.findUserCategoryById(
                input.userId,
                input.categoryId,
            );

            if (!category || category.isSystem || !category.isActive) {
                throw new CategoryNotFoundError();
            }

            // RN08 / RN10 / RNF02: bloqueia a carteira para que leituras de saldo
            // concorrentes não ultrapassem o saldo disponível.
            const wallet = await walletRepository.findUserWalletById(
                input.userId,
                input.walletId,
                { forUpdate: true },
            );

            if (!wallet) throw new WalletNotFoundError();

            const now = new Date();

            const transaction = Transaction.register(
                this.idGenerator.generate(),
                {
                    description: input.description?.trim() ?? '',
                    amount: Money.fromAmount(input.amount),
                    date: input.date,
                    type,
                    categoryId: category.id,
                    walletId: wallet.id,
                },
                now,
            );

            if (transaction.isIncome()) {
                wallet.deposit(transaction.amount);
            } else {
                wallet.withdraw(transaction.amount);
            }

            await transactionRepository.create(transaction);
            await walletRepository.update(wallet);

            return transaction;
        });

        // Evento publicado só depois do commit (seção 6.3.3 do documento)
        this.eventBus.publish(
            new TransactionCreatedEvent(
                transaction.id,
                input.userId,
                transaction.walletId,
                transaction.categoryId,
                input.type,
                transaction.amount.amount,
                transaction.date,
            ),
        );

        return { id: transaction.id };
    }
}
