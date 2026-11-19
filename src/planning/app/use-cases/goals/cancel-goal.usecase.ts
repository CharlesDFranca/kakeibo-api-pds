import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { CORE_TOKENS } from '@/core/core.tokens';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import { PLANNING_TOKENS } from '@/planning/planning.tokens';

import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import type { IPlanningUnitOfWork } from '../../contracts/planning-unit-of-work.contract';
import { GoalNotFoundError } from '../../errors/goal-not-found.error';
import { GoalMovement } from '@/planning/domain/entities/goal-movement.entity';
import type { IFinanceFacade } from '@/finance/api/finance-facade.api';

type CancelGoalInput = {
    userId: string;
    goalId: string;
};

type CancelGoalOutput = void;

@Injectable()
export class CancelGoalUseCase implements IBaseUseCase<
    CancelGoalInput,
    CancelGoalOutput
> {
    constructor(
        @Inject(PLANNING_TOKENS.UNIT_OF_WORK)
        private readonly planningUow: IPlanningUnitOfWork,
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
        @Inject(FINANCE_TOKENS.FACADE)
        private readonly financeFacade: IFinanceFacade,
    ) {}

    async execute(input: CancelGoalInput): Promise<CancelGoalOutput> {
        return this.planningUow.transaction(async () => {
            const goalRepository = this.planningUow.getGoalRepository();
            const goalMovementRepository =
                this.planningUow.getGoalMovementRepository();

            const goal = await goalRepository.findUserGoalById(
                input.userId,
                input.goalId,
            );

            if (!goal) throw new GoalNotFoundError();

            goal.validateCancellation();

            // RN07 – devolve cada aporte ativo à sua carteira de origem
            const activeDeposits =
                await goalMovementRepository.findActiveDeposits(goal.id);

            for (const deposit of activeDeposits) {
                const { transactionId } =
                    await this.financeFacade.depositToWallet({
                        userId: input.userId,
                        walletId: deposit.walletId,
                        amount: deposit.amount,
                        description: `Estorno por cancelamento da meta: ${goal.name.value}`,
                        date: new Date(),
                    });

                const now = new Date();

                await goalMovementRepository.create(
                    GoalMovement.reversalOf(
                        deposit,
                        this.idGenerator.generate(),
                        transactionId,
                        now,
                    ),
                );
            }

            goal.cancel();
            await goalRepository.update(goal);
        });
    }
}
