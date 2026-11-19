import { Money } from '@/shared/domain/value-objects/money.vo';
import { EGoalStatus } from '../../enums/goal-status.enum';
import { GoalAlreadyCancelledError } from '../../errors/goal-already-cancelled.error';
import { GoalMustBeInProgressError } from '../../errors/goal-must-be-in-progress.error';
import { GoalContext, GoalState } from './goal-state';

/** Meta cancelada: estado final. Nada muda depois do cancelamento. */
export class CancelledGoalState extends GoalState {
    public readonly status = EGoalStatus.CANCELLED;

    public override withdraw(_ctx: GoalContext, _amount: Money): void {
        throw new GoalMustBeInProgressError();
    }

    public override validateCancellation(): void {
        throw new GoalAlreadyCancelledError();
    }

    public expire(): void {
        // meta cancelada não expira
    }
}
