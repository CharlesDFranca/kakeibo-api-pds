import { Inject, Injectable } from '@nestjs/common';
import { PLANNING_TOKENS } from '@/planning/planning.tokens';
import type { IPlanningUnitOfWork } from '@/planning/app/contracts/planning-unit-of-work.contract';
import type { IFundsAllocationSource } from '@/finance/app/contracts/funds-allocation.contract';

/**
 * Planning informa ao Finance quais valores estão comprometidos com metas.
 * Implementa a porta definida pelo Finance (a dependência vai de Planning
 * para Finance).
 */
@Injectable()
export class GoalFundsAllocationSource implements IFundsAllocationSource {
    constructor(
        @Inject(PLANNING_TOKENS.UNIT_OF_WORK)
        private readonly planningUow: IPlanningUnitOfWork,
    ) {}

    isWalletAllocated(userId: string, walletId: string): Promise<boolean> {
        return this.planningUow
            .getGoalMovementRepository()
            .hasAllocatedAmountFromWallet(userId, walletId);
    }

    isTransactionAllocated(
        userId: string,
        transactionId: string,
    ): Promise<boolean> {
        return this.planningUow
            .getGoalMovementRepository()
            .existsByTransactionId(userId, transactionId);
    }
}
