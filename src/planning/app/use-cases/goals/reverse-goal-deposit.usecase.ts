import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { CORE_TOKENS } from '@/core/core.tokens';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import { PLANNING_TOKENS } from '@/planning/planning.tokens';

import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import type { IPlanningUnitOfWork } from '../../contracts/planning-unit-of-work.contract';

import { GoalMovement } from '@/planning/domain/entities/goal-movement.entity';
import { GoalMovementCannotBeRevertedError } from '@/planning/domain/errors/goal-movement-cannot-be-reverted.error';
import { GoalDepositAlreadyRevertedError } from '@/planning/domain/errors/goal-deposit-already-reverted.error';
import { GoalDepositNotFoundError } from '../../errors/goal-deposit-not-found.error';
import { GoalNotFoundError } from '../../errors/goal-not-found.error';

import type { IFinanceFacade } from '@/finance/api/finance-facade.api';

type ReverseGoalDepositInput = {
    userId: string;
    goalId?: string;
    depositId: string;
};

type ReverseGoalDepositOutput = {
    id: string;
};

@Injectable()
export class ReverseGoalDepositUseCase implements IBaseUseCase<
    ReverseGoalDepositInput,
    ReverseGoalDepositOutput
> {
    constructor(
        @Inject(PLANNING_TOKENS.UNIT_OF_WORK)
        private readonly planningUow: IPlanningUnitOfWork,
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
        @Inject(FINANCE_TOKENS.FACADE)
        private readonly financeFacade: IFinanceFacade,
    ) {}

    async execute(
        input: ReverseGoalDepositInput,
    ): Promise<ReverseGoalDepositOutput> {
        return this.planningUow.transaction(async () => {
            const goalRepository = this.planningUow.getGoalRepository();
            const goalMovementRepository =
                this.planningUow.getGoalMovementRepository();

            const deposit = await goalMovementRepository.findById(
                input.depositId,
            );

            if (!deposit) throw new GoalDepositNotFoundError();

            if (input.goalId && deposit.goalId !== input.goalId) {
                throw new GoalDepositNotFoundError();
            }

            const goal = await goalRepository.findUserGoalById(
                input.userId,
                deposit.goalId,
            );
            if (!goal) throw new GoalNotFoundError();

            if (!deposit.canRevert()) {
                throw new GoalMovementCannotBeRevertedError();
            }

            // ECUS23 – Verificar estorno único do aporte (RN13)
            if (await goalMovementRepository.isDepositReverted(deposit.id)) {
                throw new GoalDepositAlreadyRevertedError();
            }

            const { transactionId } = await this.financeFacade.depositToWallet({
                userId: input.userId,
                walletId: deposit.walletId,
                amount: deposit.amount,
                description: `Estorno de aporte da meta: ${goal.name.value}`,
                date: new Date(),
            });

            goal.withdraw(deposit.amount);

            const now = new Date();
            const withdrawMovement = GoalMovement.reversalOf(
                deposit,
                this.idGenerator.generate(),
                transactionId,
                now,
            );

            await goalMovementRepository.create(withdrawMovement);
            await goalRepository.update(goal);

            return {
                id: withdrawMovement.id,
            };
        });
    }
}
