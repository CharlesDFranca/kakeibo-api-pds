import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { Inject, Injectable } from '@nestjs/common';
import type { IFinanceUnitOfWork } from '../../contracts/finance-unit-of-work.contract';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import { CORE_TOKENS } from '@/core/core.tokens';
import { Transfer } from '@/finance/domain/entities/transfer.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { Transaction } from '@/finance/domain/entities/transaction.entity';
import { CategoryNotFoundError } from '../../errors/category-not-found.error';
import { lockUserWalletPair } from '../../services/wallet-locking';
import { TransferNotFoundError } from '../../errors/transfer-not-found.error';
import { TransferCannotBeRevertedError } from '@/finance/domain/errors/transfer-cannot-be-reverted.error';
import { SystemCategory } from '@/finance/domain/enums/system-categories.enum';

type RevertTransferInput = {
    userId: string;
    transferId: string;
};

type RevertTransferOutput = void;

@Injectable()
export class RevertTransferUseCase implements IBaseUseCase<
    RevertTransferInput,
    RevertTransferOutput
> {
    constructor(
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
        @Inject(FINANCE_TOKENS.UNIT_OF_WORK)
        private readonly financeUow: IFinanceUnitOfWork,
    ) {}

    async execute(input: RevertTransferInput): Promise<RevertTransferOutput> {
        await this.financeUow.transaction(async () => {
            const walletRepository = this.financeUow.getWalletRepository();
            const categoryRepository = this.financeUow.getCategoryRepository();
            const transferRepository = this.financeUow.getTransferRepository();
            const transactionRepository =
                this.financeUow.getTransactionRepository();

            const found = await transferRepository.findUserTransferById(
                input.userId,
                input.transferId,
            );

            if (!found) throw new TransferNotFoundError();

            // Bloqueia as duas carteiras (em ordem fixa, sem deadlock) antes de
            // validar o estado da transferência (RN08 / RNF02).
            // No estorno o valor volta da carteira de destino para a de origem.
            const [sourceWallet, destinationWallet] = await lockUserWalletPair(
                walletRepository,
                input.userId,
                found.destinationWalletId,
                found.sourceWalletId,
            );

            // Relê a transferência já com o lock: um estorno concorrente da
            // mesma transferência não pode ser aplicado duas vezes.
            const transfer = await transferRepository.findUserTransferById(
                input.userId,
                input.transferId,
            );

            if (!transfer) throw new TransferNotFoundError();

            if (!transfer.canRevert()) {
                throw new TransferCannotBeRevertedError();
            }

            const category = await categoryRepository.findSystemCategory(
                input.userId,
                SystemCategory.TRANSFER,
            );

            if (!category) throw new CategoryNotFoundError();

            const now = new Date();

            const sourceTransaction = Transaction.transferOut(
                this.idGenerator.generate(),
                {
                    amount: transfer.amount,
                    walletId: sourceWallet.id,
                    categoryId: category.id,
                },
                now,
            );

            const destinationTransaction = Transaction.transferIn(
                this.idGenerator.generate(),
                {
                    amount: transfer.amount,
                    walletId: destinationWallet.id,
                    categoryId: category.id,
                },
                now,
            );

            sourceWallet.withdraw(transfer.amount);
            destinationWallet.deposit(transfer.amount);
            transfer.revert();

            await walletRepository.update(sourceWallet);
            await walletRepository.update(destinationWallet);

            await transactionRepository.create(sourceTransaction);
            await transactionRepository.create(destinationTransaction);

            await transferRepository.update(transfer);

            return transfer;
        });
    }
}
