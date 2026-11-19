import { Money } from '@/shared/domain/value-objects/money.vo';
import { EGoalStatus } from '../../enums/goal-status.enum';
import { GoalDeadline } from '../../value-objects/goal-deadline.vo';
import { GoalWithoutDeadlineCannotExpireError } from '../../errors/goal-without-deadline-cannot-expire.error';
import { GoalDeadlineMustBeReachedBeforeExpirationError } from '../../errors/goal-deadline-must-be-reached-before-expiration.error';
import { GoalDeadlineCannotAlreadyBeExpiredError } from '../../errors/goal-deadline-cannot-already-be-expired.error';
import { GoalContext, GoalState } from './goal-state';

/** Meta em andamento: o único estado que aceita aportes e edição. */
export class InProgressGoalState extends GoalState {
    public readonly status = EGoalStatus.IN_PROGRESS;

    public override contribute(ctx: GoalContext, amount: Money): void {
        ctx.setCurrentAmount(ctx.currentAmount.add(amount));
        this.concludeIfTargetReached(ctx);
    }

    public override complete(ctx: GoalContext): void {
        this.completeIfTargetReached(ctx);
        ctx.touch();
    }

    public expire(ctx: GoalContext): void {
        if (!ctx.deadline) throw new GoalWithoutDeadlineCannotExpireError();

        if (!ctx.deadline.isExpired()) {
            throw new GoalDeadlineMustBeReachedBeforeExpirationError();
        }

        ctx.transitionTo(EGoalStatus.EXPIRED);
        ctx.touch();
    }

    public override expireIfDeadlineReached(
        ctx: GoalContext,
        now: Date,
    ): boolean {
        if (!ctx.deadline || !ctx.deadline.isExpired(now)) return false;

        ctx.transitionTo(EGoalStatus.EXPIRED);
        ctx.touch();

        return true;
    }

    public override updateTarget(ctx: GoalContext, amount: Money): void {
        ctx.setTargetAmount(amount);
        this.concludeIfTargetReached(ctx);
    }

    public override updateDeadline(
        ctx: GoalContext,
        deadline?: GoalDeadline,
    ): void {
        if (deadline?.isExpired()) {
            throw new GoalDeadlineCannotAlreadyBeExpiredError();
        }

        ctx.setDeadline(deadline);
        ctx.touch();
    }

    /** Aporte ou novo alvo que cobre o saldo conclui a meta (RN12). */
    private concludeIfTargetReached(ctx: GoalContext): void {
        if (ctx.currentAmount.isGreaterThanOrEqual(ctx.targetAmount)) {
            this.complete(ctx);
            return;
        }

        ctx.touch();
    }
}
