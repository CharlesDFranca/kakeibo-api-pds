import { Money } from '@/shared/domain/value-objects/money.vo';
import { EGoalStatus } from '../../enums/goal-status.enum';
import { GoalDeadline } from '../../value-objects/goal-deadline.vo';
import { GoalMustBeInProgressError } from '../../errors/goal-must-be-in-progress.error';
import { OnlyExpiredGoalsCanBeReactivatedError } from '../../errors/only-expired-goals-can-be-reactivated.error';
import { InsufficientGoalBalanceError } from '../../errors/insufficient-goal-balance.error';
import { GoalTargetAmountMustBeReachedError } from '../../errors/goal-target-amount-must-be-reached.error';

/**
 * O que um estado pode ler e alterar na meta. O `Goal` implementa este
 * contrato; assim os estados não conhecem as props internas da entidade.
 */
export interface GoalContext {
    readonly currentAmount: Money;
    readonly targetAmount: Money;
    readonly deadline: GoalDeadline | undefined;
    setCurrentAmount(amount: Money): void;
    setTargetAmount(amount: Money): void;
    setDeadline(deadline: GoalDeadline | undefined): void;
    transitionTo(status: EGoalStatus): void;
    touch(): void;
}

/**
 * State (GoF). Cada estado da meta decide como reage a cada operação:
 * aceita e faz a transição, ignora ou lança o erro de domínio. O `Goal`
 * só delega; não há `if` por status espalhado pela entidade.
 *
 * Os padrões abaixo valem para a maioria dos estados; cada subclasse
 * sobrescreve só o que difere.
 */
export abstract class GoalState {
    public abstract readonly status: EGoalStatus;

    /** Aporte (RN12): só metas em andamento recebem. */
    public contribute(_ctx: GoalContext, _amount: Money): void {
        throw new GoalMustBeInProgressError();
    }

    /** Retirada: permitida enquanto houver saldo. */
    public withdraw(ctx: GoalContext, amount: Money): void {
        this.subtractFromBalance(ctx, amount);
        ctx.touch();
    }

    /** Conclusão: exige o valor-alvo atingido. */
    public complete(ctx: GoalContext): void {
        this.completeIfTargetReached(ctx);
    }

    /** Reativação (RN12): só metas expiradas. */
    public reactivate(_ctx: GoalContext, _deadline?: GoalDeadline): void {
        throw new OnlyExpiredGoalsCanBeReactivatedError();
    }

    public abstract expire(ctx: GoalContext): void;

    /** Expiração automática (RN11): só atua em metas em andamento. */
    public expireIfDeadlineReached(_ctx: GoalContext, _now: Date): boolean {
        return false;
    }

    public validateCancellation(): void {
        // a maioria dos estados aceita o cancelamento
    }

    public cancel(ctx: GoalContext): void {
        this.validateCancellation();

        ctx.setCurrentAmount(Money.zero());
        ctx.transitionTo(EGoalStatus.CANCELLED);
        ctx.touch();
    }

    public updateTarget(_ctx: GoalContext, _amount: Money): void {
        throw new GoalMustBeInProgressError();
    }

    public updateDeadline(_ctx: GoalContext, _deadline?: GoalDeadline): void {
        throw new GoalMustBeInProgressError();
    }

    // ---- passos reutilizados pelos estados ----

    protected subtractFromBalance(ctx: GoalContext, amount: Money): void {
        if (amount.isGreaterThan(ctx.currentAmount)) {
            throw new InsufficientGoalBalanceError();
        }

        ctx.setCurrentAmount(ctx.currentAmount.subtract(amount));
    }

    protected completeIfTargetReached(ctx: GoalContext): void {
        if (ctx.currentAmount.isLessThan(ctx.targetAmount)) {
            throw new GoalTargetAmountMustBeReachedError();
        }

        ctx.transitionTo(EGoalStatus.COMPLETED);
        ctx.setDeadline(undefined); // meta concluída não tem mais prazo
    }
}
