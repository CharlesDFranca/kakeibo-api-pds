import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import type { IGoalRepository } from '../../../domain/repositories/goal-repository.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PLANNING_TOKENS } from '@/planning/planning.tokens';

type ListGoalsInput = {
    userId: string;
};

type ListGoalsOutput = {
    goals: {
        id: string;
        name: string;
        status: string;
        currentAmount: string;
        targetAmount: string;
        deadline: string | null;
    }[];
};

@Injectable()
export class ListGoalsUseCase implements IBaseUseCase<
    ListGoalsInput,
    ListGoalsOutput
> {
    constructor(
        @Inject(PLANNING_TOKENS.GOAL_REPOSITORY)
        private readonly goalRepository: IGoalRepository,
    ) {}

    async execute(input: ListGoalsInput): Promise<ListGoalsOutput> {
        const goals = await this.goalRepository.findAllForUser(input.userId);

        // RN11 – expiração automática ao atingir o prazo
        for (const goal of goals) {
            if (goal.expireIfDeadlineReached()) {
                await this.goalRepository.update(goal);
            }
        }

        return {
            goals: goals.map((goal) => ({
                id: goal.id,
                name: goal.name.value,
                status: goal.status.value,
                currentAmount: goal.currentAmount.amount,
                targetAmount: goal.targetAmount.amount,
                deadline: goal.deadline?.date.toISOString() ?? null,
            })),
        };
    }
}
