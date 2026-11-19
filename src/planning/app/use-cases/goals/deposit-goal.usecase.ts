import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { CORE_TOKENS } from '@/core/core.tokens';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import { PLANNING_TOKENS } from '@/planning/planning.tokens';

import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import type { IPlanningUnitOfWork } from '../../contracts/planning-unit-of-work.contract';

import { GoalMovement } from '@/planning/domain/entities/goal-movement.entity';
import { GoalExpiredCannotReceiveDepositError } from '@/planning/domain/errors/goal-expired-cannot-receive-deposit.error';
import { GoalMustBeInProgressError } from '@/planning/domain/errors/goal-must-be-in-progress.error';
import { GoalNotFoundError } from '../../errors/goal-not-found.error';

import type { IEventBus } from '@/shared/events/event-bus.contract';
import { GoalReachedEvent } from '@/planning/domain/events/goal-reached.event';
import type { IFinanceFacade } from '@/finance/api/finance-facade.api';

type DepositGoalInput = {
    userId: string;
    walletId: string;
    goalId: string;
    amount: string;
};

type DepositGoalOutput = { id: string };

type DepositGoalResult =
    | {
          id: string;
          reached: boolean;
          targetAmount: string;
          goalName: string;
      }
    | { expired: true };

@Injectable()
export class DepositGoalUseCase implements IBaseUseCase<
    DepositGoalInput,
    DepositGoalOutput
> {
    constructor(
        @Inject(PLANNING_TOKENS.UNIT_OF_WORK)
        private readonly planningUow: IPlanningUnitOfWork,
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
        @Inject(FINANCE_TOKENS.FACADE)
        private readonly financeFacade: IFinanceFacade,
        @Inject(CORE_TOKENS.EVENT_BUS)
        private readonly eventBus: IEventBus,
    ) {}

    async execute(input: DepositGoalInput): Promise<DepositGoalOutput> {
        // Valor positivo e com no máximo duas casas decimais (RN14/RN15)
        const amount = Money.fromAmount(input.amount);

        const result = await this.planningUow.transaction(
            async (): Promise<DepositGoalResult> => {
                const goalRepository = this.planningUow.getGoalRepository();
                const goalMovementRepository =
                    this.planningUow.getGoalMovementRepository();

                const goal = await goalRepository.findUserGoalById(
                    input.userId,
                    input.goalId,
                );
                if (!goal) throw new GoalNotFoundError();

                // ECUS24 – Verificar validade da meta (RN11 / RN12)
                if (goal.expireIfDeadlineReached()) {
                    await goalRepository.update(goal);
                }

                if (goal.isExpired()) return { expired: true };

                if (!goal.isInProgress()) throw new GoalMustBeInProgressError();

                const necessary = goal.necessaryToComplete();
                const contribution = amount.isGreaterThan(necessary)
                    ? necessary
                    : amount;

                const { transactionId } =
                    await this.financeFacade.withdrawFromWallet({
                        userId: input.userId,
                        walletId: input.walletId,
                        amount: contribution,
                        description: `Aporte na meta: ${goal.name.value}`,
                        date: new Date(),
                    });

                goal.contribute(contribution);

                const now = new Date();
                const goalMovement = GoalMovement.deposit(
                    this.idGenerator.generate(),
                    {
                        amount: contribution,
                        goalId: goal.id,
                        walletId: input.walletId,
                        transactionId,
                    },
                    now,
                );

                await goalMovementRepository.create(goalMovement);
                await goalRepository.update(goal);

                return {
                    id: goalMovement.id,
                    reached: goal.isCompleted(),
                    targetAmount: goal.targetAmount.amount,
                    goalName: goal.name.value,
                };
            },
        );

        if ('expired' in result)
            throw new GoalExpiredCannotReceiveDepositError();

        // Evento publicado só depois do commit (seção 6.3.3 do documento)
        if (result.reached) {
            this.eventBus.publish(
                new GoalReachedEvent(
                    input.goalId,
                    input.userId,
                    result.goalName,
                    result.targetAmount,
                ),
            );
        }

        return { id: result.id };
    }
}
