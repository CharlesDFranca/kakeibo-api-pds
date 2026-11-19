import { Goal } from '../goal.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { GoalStatus } from '../../value-objects/goal-status.vo';
import { GoalDeadline } from '../../value-objects/goal-deadline.vo';
import { EGoalStatus } from '../../enums/goal-status.enum';
import { goalStateFor } from './index';
import { InProgressGoalState } from './in-progress.state';
import { CompletedGoalState } from './completed.state';
import { ExpiredGoalState } from './expired.state';
import { CancelledGoalState } from './cancelled.state';
import { GoalMustBeInProgressError } from '../../errors/goal-must-be-in-progress.error';
import { CompletedGoalCannotBeExpiredError } from '../../errors/completed-goal-cannot-be-expired.error';
import { ExpiredGoalCannotBeCompletedError } from '../../errors/expired-goal-cannot-be-completed.error';
import { OnlyExpiredGoalsCanBeReactivatedError } from '../../errors/only-expired-goals-can-be-reactivated.error';
import { GoalAlreadyCancelledError } from '../../errors/goal-already-cancelled.error';
import { GoalTargetAmountMustBeReachedError } from '../../errors/goal-target-amount-must-be-reached.error';
import { GoalWithoutDeadlineCannotExpireError } from '../../errors/goal-without-deadline-cannot-expire.error';
import { GoalDeadlineMustBeReachedBeforeExpirationError } from '../../errors/goal-deadline-must-be-reached-before-expiration.error';
import { InsufficientGoalBalanceError } from '../../errors/insufficient-goal-balance.error';

const DAY = 24 * 60 * 60 * 1000;
const money = (v: string) => Money.fromAmount(v);

function goal(
    status: EGoalStatus,
    o: { current?: string; deadline?: 'future' | 'past' | 'none' } = {},
): Goal {
    const created = new Date(Date.now() - 10 * DAY);
    const kind = o.deadline ?? 'future';
    const deadline =
        kind === 'none'
            ? undefined
            : new GoalDeadline(new Date(created.getTime() + (kind === 'past' ? 2 : 20) * DAY), created);
    return new Goal(
        'g',
        {
            userId: 'u',
            name: new Name('Viagem'),
            targetAmount: money('100.00'),
            currentAmount: money(o.current ?? '0.00'),
            deadline,
            status: new GoalStatus(status),
        },
        created,
        created,
    );
}

describe('goalStateFor', () => {
    it('cada status persistido corresponde a um estado', () => {
        expect(goalStateFor(EGoalStatus.IN_PROGRESS) instanceof InProgressGoalState).toBe(true);
        expect(goalStateFor(EGoalStatus.COMPLETED) instanceof CompletedGoalState).toBe(true);
        expect(goalStateFor(EGoalStatus.EXPIRED) instanceof ExpiredGoalState).toBe(true);
        expect(goalStateFor(EGoalStatus.CANCELLED) instanceof CancelledGoalState).toBe(true);
    });
});

describe('Goal – estado EM ANDAMENTO', () => {
    it('aporte parcial mantém em andamento e soma o saldo', () => {
        const g = goal(EGoalStatus.IN_PROGRESS);
        g.contribute(money('30.00'));

        expect(g.isInProgress()).toBe(true);
        expect(g.currentAmount.equals(money('30.00'))).toBe(true);
    });

    it('aporte que cobre o alvo conclui a meta e remove o prazo', () => {
        const g = goal(EGoalStatus.IN_PROGRESS, { current: '60.00' });
        g.contribute(money('40.00'));

        expect(g.isCompleted()).toBe(true);
        expect(g.deadline).toBeUndefined();
    });

    it('aumentar o alvo acima do saldo continua em andamento; reduzir até o saldo conclui', () => {
        const g = goal(EGoalStatus.IN_PROGRESS, { current: '50.00' });
        g.updateTarget(money('200.00'));
        expect(g.isInProgress()).toBe(true);

        g.updateTarget(money('50.00'));
        expect(g.isCompleted()).toBe(true);
    });

    it('não conclui manualmente antes de atingir o alvo', () => {
        expect(() => goal(EGoalStatus.IN_PROGRESS, { current: '10.00' }).complete()).toThrow(
            GoalTargetAmountMustBeReachedError,
        );
    });

    it('prazo novo precisa estar no futuro', () => {
        const g = goal(EGoalStatus.IN_PROGRESS);
        const past = new GoalDeadline(new Date(Date.now() - DAY), new Date(Date.now() - 3 * DAY));

        expect(() => g.updateDeadline(past)).toThrow();
        g.updateDeadline(undefined);
        expect(g.deadline).toBeUndefined();
    });

    it('expire() exige prazo definido e vencido', () => {
        expect(() => goal(EGoalStatus.IN_PROGRESS, { deadline: 'none' }).expire()).toThrow(
            GoalWithoutDeadlineCannotExpireError,
        );
        expect(() => goal(EGoalStatus.IN_PROGRESS, { deadline: 'future' }).expire()).toThrow(
            GoalDeadlineMustBeReachedBeforeExpirationError,
        );

        const g = goal(EGoalStatus.IN_PROGRESS, { deadline: 'past' });
        g.expire();
        expect(g.isExpired()).toBe(true);
    });

    it('expireIfDeadlineReached só age quando o prazo venceu', () => {
        expect(goal(EGoalStatus.IN_PROGRESS, { deadline: 'future' }).expireIfDeadlineReached()).toBe(false);
        expect(goal(EGoalStatus.IN_PROGRESS, { deadline: 'none' }).expireIfDeadlineReached()).toBe(false);

        const g = goal(EGoalStatus.IN_PROGRESS, { deadline: 'past' });
        expect(g.expireIfDeadlineReached()).toBe(true);
        expect(g.isExpired()).toBe(true);
    });

    it('não retira mais que o saldo; retirada válida mantém o estado', () => {
        const g = goal(EGoalStatus.IN_PROGRESS, { current: '20.00' });

        expect(() => g.withdraw(money('20.01'))).toThrow(InsufficientGoalBalanceError);
        g.withdraw(money('5.00'));
        expect(g.currentAmount.equals(money('15.00'))).toBe(true);
        expect(g.isInProgress()).toBe(true);
    });
});

describe('Goal – estado CONCLUÍDA', () => {
    it('não recebe aporte nem edição', () => {
        const g = goal(EGoalStatus.COMPLETED, { current: '100.00', deadline: 'none' });

        expect(() => g.contribute(money('1.00'))).toThrow(GoalMustBeInProgressError);
        expect(() => g.updateTarget(money('500.00'))).toThrow(GoalMustBeInProgressError);
        expect(() => g.updateDeadline(undefined)).toThrow(GoalMustBeInProgressError);
    });

    it('complete() é idempotente e não expira', () => {
        const g = goal(EGoalStatus.COMPLETED, { current: '100.00', deadline: 'none' });

        g.complete();
        expect(g.isCompleted()).toBe(true);
        expect(() => g.expire()).toThrow(CompletedGoalCannotBeExpiredError);
        expect(g.expireIfDeadlineReached()).toBe(false);
    });

    it('retirada que deixa o saldo abaixo do alvo volta para em andamento', () => {
        const g = goal(EGoalStatus.COMPLETED, { current: '100.00', deadline: 'none' });
        g.withdraw(money('1.00'));

        expect(g.isInProgress()).toBe(true);
    });

    it('não pode ser reativada', () => {
        expect(() => goal(EGoalStatus.COMPLETED, { current: '100.00' }).reactivate()).toThrow(
            OnlyExpiredGoalsCanBeReactivatedError,
        );
    });
});

describe('Goal – estado EXPIRADA', () => {
    it('não recebe aporte nem conclui', () => {
        const g = goal(EGoalStatus.EXPIRED, { current: '100.00', deadline: 'past' });

        expect(() => g.contribute(money('1.00'))).toThrow(GoalMustBeInProgressError);
        expect(() => g.complete()).toThrow(ExpiredGoalCannotBeCompletedError);
    });

    it('expire() é idempotente', () => {
        const g = goal(EGoalStatus.EXPIRED, { deadline: 'past' });
        g.expire();

        expect(g.isExpired()).toBe(true);
    });

    it('permite retirar (estorno) e continua expirada', () => {
        const g = goal(EGoalStatus.EXPIRED, { current: '30.00', deadline: 'past' });
        g.withdraw(money('30.00'));

        expect(g.isExpired()).toBe(true);
        expect(g.currentAmount.isZero()).toBe(true);
    });

    it('reativar volta para em andamento com o novo prazo', () => {
        const g = goal(EGoalStatus.EXPIRED, { deadline: 'past' });
        const now = new Date();
        g.reactivate(new GoalDeadline(new Date(now.getTime() + 5 * DAY), now));

        expect(g.isInProgress()).toBe(true);
        expect(g.deadline !== undefined).toBe(true);
    });
});

describe('Goal – estado CANCELADA', () => {
    it('é estado final: nada de aporte, retirada, edição ou nova expiração', () => {
        const g = goal(EGoalStatus.CANCELLED, { deadline: 'past' });

        expect(() => g.contribute(money('1.00'))).toThrow(GoalMustBeInProgressError);
        expect(() => g.withdraw(money('1.00'))).toThrow(GoalMustBeInProgressError);
        expect(() => g.updateTarget(money('10.00'))).toThrow(GoalMustBeInProgressError);
        expect(() => g.reactivate()).toThrow(OnlyExpiredGoalsCanBeReactivatedError);
        expect(g.expireIfDeadlineReached()).toBe(false);

        g.expire(); // não ressuscita como expirada
        expect(g.isCancelled()).toBe(true);
    });

    it('cancelar de novo falha', () => {
        const g = goal(EGoalStatus.CANCELLED);

        expect(() => g.validateCancellation()).toThrow(GoalAlreadyCancelledError);
        expect(() => g.cancel()).toThrow(GoalAlreadyCancelledError);
    });
});

describe('Goal – cancelamento a partir dos demais estados', () => {
    it('zera o saldo e cancela, qualquer que seja o estado de origem', () => {
        for (const status of [EGoalStatus.IN_PROGRESS, EGoalStatus.COMPLETED, EGoalStatus.EXPIRED]) {
            const g = goal(status, { current: '40.00', deadline: 'none' });
            g.cancel();

            expect(g.isCancelled()).toBe(true);
            expect(g.currentAmount.isZero()).toBe(true);
        }
    });
});
