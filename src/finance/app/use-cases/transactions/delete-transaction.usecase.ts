import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { Inject, Injectable } from '@nestjs/common';
import type { IFinanceUnitOfWork } from '../../contracts/finance-unit-of-work.contract';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import type { IFundsAllocationSource } from '../../contracts/funds-allocation.contract';
import { TransactionNotFoundError } from '../../errors/transaction-not-found.error';
import { WalletNotFoundError } from '../../errors/wallet-not-found.error';
import { TransactionLinkedToGoalError } from '../../errors/transaction-linked-to-goal.error';
import { TransactionCannotBeDeletedError } from '@/finance/domain/errors/transaction-cannot-be-deleted.error';

type DeleteTransactionInput = {
    userId: string;
    transactionId: string;
};

type DeleteTransactionOutput = void;

@Injectable()
export class DeleteTransactionUseCase implements IBaseUseCase<
    DeleteTransactionInput,
    DeleteTransactionOutput
> {
    constructor(
        @Inject(FINANCE_TOKENS.UNIT_OF_WORK)
        private readonly financeUoW: IFinanceUnitOfWork,
        @Inject(FINANCE_TOKENS.FUNDS_ALLOCATION)
        private readonly fundsAllocation: IFundsAllocationSource,
    ) {}

    async execute(
        input: DeleteTransactionInput,
    ): Promise<DeleteTransactionOutput> {
        await this.financeUoW.transaction(async () => {
            const transactionRepository =
                this.financeUoW.getTransactionRepository();
            const walletRepository = this.financeUoW.getWalletRepository();

            const found = await transactionRepository.findUserTransactionById(
                input.userId,
                input.transactionId,
            );

            if (!found) throw new TransactionNotFoundError();

            // Bloqueia a carteira antes de ajustar o saldo (RN08 / RNF02).
            const wallet = await walletRepository.findUserWalletById(
                input.userId,
                found.walletId,
                { forUpdate: true },
            );

            if (!wallet) throw new WalletNotFoundError();

            // Relê a transação já com o lock: se uma exclusão concorrente a
            // removeu enquanto esperávamos, o saldo não pode ser ajustado duas
            // vezes.
            const transaction =
                await transactionRepository.findUserTransactionById(
                    input.userId,
                    input.transactionId,
                );

            if (!transaction) throw new TransactionNotFoundError();

            // ECUS22 – Verificar vínculo com meta (RN03)
            const linkedToGoal = await this.fundsAllocation.isTransactionAllocated(
                input.userId,
                transaction.id,
            );

            if (linkedToGoal) throw new TransactionLinkedToGoalError();

            if (!transaction.canBeDeleted()) {
                throw new TransactionCannotBeDeletedError();
            }

            // RN08 / RN15 – o ajuste não pode gerar saldo inválido
            wallet.validateBalanceAdjustmentForDeletionOf(transaction);

            wallet.adjustBalanceForDeletionOf(transaction);

            await walletRepository.update(wallet);
            await transactionRepository.delete(transaction.id);
        });
    }
}
