import { EGoalStatus } from '../../enums/goal-status.enum';
import { GoalDeadline } from '../../value-objects/goal-deadline.vo';
import { ExpiredGoalCannotBeCompletedError } from '../../errors/expired-goal-cannot-be-completed.error';
import { GoalContext, GoalState } from './goal-state';

/** Meta expirada (RN11): não recebe aportes, mas pode ser reativada (RN12). */
export class ExpiredGoalState extends GoalState {
    public readonly status = EGoalStatus.EXPIRED;

    public override complete(): void {
        throw new ExpiredGoalCannotBeCompletedError();
    }

    public override reactivate(ctx: GoalContext, deadline?: GoalDeadline): void {
        ctx.setDeadline(deadline);
        ctx.transitionTo(EGoalStatus.IN_PROGRESS);
        ctx.touch();
    }

    public expire(): void {
        // já expirada: nada a fazer
    }
}
