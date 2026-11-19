import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { PLANNING_TOKENS } from '@/planning/planning.tokens';
import type { IGoalRepository } from '../../../domain/repositories/goal-repository.interface';
import { GoalDeadline } from '../../../domain/value-objects/goal-deadline.vo';
import { GoalNotFoundError } from '../../errors/goal-not-found.error';

type ReactivateGoalInput = {
    userId: string;
    goalId: string;
    deadline: Date;
};

type ReactivateGoalOutput = void;

@Injectable()
export class ReactivateGoalUseCase implements IBaseUseCase<
    ReactivateGoalInput,
    ReactivateGoalOutput
> {
    constructor(
        @Inject(PLANNING_TOKENS.GOAL_REPOSITORY)
        private readonly goalRepository: IGoalRepository,
    ) {}

    async execute(input: ReactivateGoalInput): Promise<void> {
        const goal = await this.goalRepository.findUserGoalById(
            input.userId,
            input.goalId,
        );

        if (!goal) throw new GoalNotFoundError();

        const now = new Date();

        // RN11: a meta vencida expira automaticamente antes de ser reativada
        goal.expireIfDeadlineReached(now);

        goal.reactivate(new GoalDeadline(input.deadline, now));

        await this.goalRepository.update(goal);
    }
}
