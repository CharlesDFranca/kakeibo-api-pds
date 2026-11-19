import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { Inject, Injectable } from '@nestjs/common';
import type { IGoalRepository } from '../../../domain/repositories/goal-repository.interface';
import type { IGoalMovementRepository } from '../../../domain/repositories/goal-movement-repository.interface';
import { PLANNING_TOKENS } from '@/planning/planning.tokens';
import { GoalNotFoundError } from '../../errors/goal-not-found.error';

type FindGoalByIdInput = {
    userId: string;
    goalId: string;
};

type FindGoalByIdOutput = {
    goalId: string;
    name: string;
    status: string;
    targetAmount: string;
    currentAmount: string;
    deadline: string | null;
    movements: {
        id: string;
        type: string;
        amount: string;
        walletId: string;
        revertedDepositId: string | null;
        reverted: boolean;
        createdAt: string;
    }[];
};

@Injectable()
export class FindGoalByIdUseCase implements IBaseUseCase<
    FindGoalByIdInput,
    FindGoalByIdOutput
> {
    constructor(
        @Inject(PLANNING_TOKENS.GOAL_REPOSITORY)
        private readonly goalRepository: IGoalRepository,
        @Inject(PLANNING_TOKENS.GOAL_MOVEMENT_REPOSITORY)
        private readonly goalMovementsRepository: IGoalMovementRepository,
    ) {}

    async execute(input: FindGoalByIdInput): Promise<FindGoalByIdOutput> {
        const goal = await this.goalRepository.findUserGoalById(
            input.userId,
            input.goalId,
        );

        if (!goal) throw new GoalNotFoundError();

        // RN11 – expiração automática ao atingir o prazo
        if (goal.expireIfDeadlineReached()) {
            await this.goalRepository.update(goal);
        }

        const goalMovements = await this.goalMovementsRepository.findByGoalId(
            goal.id,
        );

        const revertedDepositIds = new Set(
            goalMovements
                .map((movement) => movement.revertedDepositId)
                .filter((id): id is string => !!id),
        );

        const movements = goalMovements.map((goalMovement) => ({
            id: goalMovement.id,
            type: goalMovement.type.value,
            amount: goalMovement.amount.amount,
            walletId: goalMovement.walletId,
            revertedDepositId: goalMovement.revertedDepositId ?? null,
            reverted: revertedDepositIds.has(goalMovement.id),
            createdAt: goalMovement.createdAt.toISOString(),
        }));

        return {
            goalId: goal.id,
            name: goal.name.value,
            status: goal.status.value,
            targetAmount: goal.targetAmount.amount,
            currentAmount: goal.currentAmount.amount,
            deadline: goal.deadline?.date.toISOString() ?? null,
            movements,
        };
    }
}
