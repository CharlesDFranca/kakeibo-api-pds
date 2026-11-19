import { GoalMovement } from '../entities/goal-movement.entity';

export interface IGoalMovementRepository {
    create(goalMovement: GoalMovement): Promise<void>;
    findById(id: string): Promise<GoalMovement | null>;
    findByGoalId(goalId: string): Promise<GoalMovement[]>;
    deleteByGoalId(goalId: string): Promise<void>;
    findActiveDeposits(goalId: string): Promise<GoalMovement[]>;
    isDepositReverted(depositId: string): Promise<boolean>;
    existsByTransactionId(
        userId: string,
        transactionId: string,
    ): Promise<boolean>;
    hasAllocatedAmountFromWallet(
        userId: string,
        walletId: string,
    ): Promise<boolean>;
}
