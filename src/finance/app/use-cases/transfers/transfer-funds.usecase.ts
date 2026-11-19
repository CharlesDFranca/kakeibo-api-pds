import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { Inject, Injectable } from '@nestjs/common';
import type { IFinanceUnitOfWork } from '../../contracts/finance-unit-of-work.contract';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import { CORE_TOKENS } from '@/core/core.tokens';
import { Transfer } from '@/finance/domain/entities/transfer.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { Transaction } from '@/finance/domain/entities/transaction.entity';
import { lockUserWalletPair } from '../../services/wallet-locking';
import { CategoryNotFoundError } from '../../errors/category-not-found.error';
import { CannotTransferToSameWalletError } from '@/finance/domain/errors/cannot-transfer-to-same-wallet.error';
import { ETransferStatus } from '@/finance/domain/enums/transfer-status.enum';
import { SystemCategory } from '@/finance/domain/enums/system-categories.enum';

type CreateTransferInput = {
    userId: string;
    amount: string;
    sourceWalletId: string;
    destinationWalletId: string;
};

type CreateTransferOutput = { id: string };

@Injectable()
export class TransferFundsUseCase implements IBaseUseCase<
    CreateTransferInput,
    CreateTransferOutput
> {
    constructor(
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
        @Inject(FINANCE_TOKENS.UNIT_OF_WORK)
        private readonly financeUow: IFinanceUnitOfWork,
    ) {}

    async execute(input: CreateTransferInput): Promise<CreateTransferOutput> {
        if (input.sourceWalletId === input.destinationWalletId) {
            throw new CannotTransferToSameWalletError();
        }

        const transfer = await this.financeUow.transaction(async () => {
            const walletRepository = this.financeUow.getWalletRepository();
            const categoryRepository = this.financeUow.getCategoryRepository();
            const transferRepository = this.financeUow.getTransferRepository();
            const transactionRepository =
                this.financeUow.getTransactionRepository();

            // Bloqueia as duas carteiras em ordem fixa (RN08 / RN10 / RNF02).
            const [sourceWallet, destinationWallet] = await lockUserWalletPair(
                walletRepository,
                input.userId,
                input.sourceWalletId,
                input.destinationWalletId,
            );

            const category = await categoryRepository.findSystemCategory(
                input.userId,
                SystemCategory.TRANSFER,
            );

            if (!category) throw new CategoryNotFoundError();

            const now = new Date();
            const amount = Money.fromAmount(input.amount);

            const sourceTransaction = Transaction.transferOut(
                this.idGenerator.generate(),
                {
                    amount,
                    walletId: sourceWallet.id,
                    categoryId: category.id,
                },
                now,
            );

            const destinationTransaction = Transaction.transferIn(
                this.idGenerator.generate(),
                {
                    amount,
                    walletId: destinationWallet.id,
                    categoryId: category.id,
                },
                now,
            );

            const transfer = new Transfer(
                this.idGenerator.generate(),
                {
                    amount,
                    sourceWalletId: sourceWallet.id,
                    destinationWalletId: destinationWallet.id,
                    sourceTransactionId: sourceTransaction.id,
                    destinationTransactionId: destinationTransaction.id,
                    status: ETransferStatus.COMPLETED,
                },
                now,
                now,
            );

            sourceWallet.withdraw(amount);
            destinationWallet.deposit(amount);

            await walletRepository.update(sourceWallet);
            await walletRepository.update(destinationWallet);

            await transactionRepository.create(sourceTransaction);
            await transactionRepository.create(destinationTransaction);

            await transferRepository.create(transfer);

            return transfer;
        });

        return { id: transfer.id };
    }
}
