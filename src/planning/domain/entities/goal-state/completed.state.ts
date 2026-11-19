import { Money } from '@/shared/domain/value-objects/money.vo';
import { EGoalStatus } from '../../enums/goal-status.enum';
import { CompletedGoalCannotBeExpiredError } from '../../errors/completed-goal-cannot-be-expired.error';
import { GoalContext, GoalState } from './goal-state';

/** Meta concluída: não recebe aportes; uma retirada a devolve a "em andamento". */
export class CompletedGoalState extends GoalState {
    public readonly status = EGoalStatus.COMPLETED;

    public override withdraw(ctx: GoalContext, amount: Money): void {
        this.subtractFromBalance(ctx, amount);

        if (ctx.currentAmount.isLessThan(ctx.targetAmount)) {
            ctx.transitionTo(EGoalStatus.IN_PROGRESS);
        }

        ctx.touch();
    }

    public override complete(): void {
        // já concluída: nada a fazer
    }

    public expire(): void {
        throw new CompletedGoalCannotBeExpiredError();
    }
}
