import { Goal } from './goal.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { GoalStatus } from '../value-objects/goal-status.vo';
import { GoalDeadline } from '../value-objects/goal-deadline.vo';
import { EGoalStatus } from '../enums/goal-status.enum';

const DAY = 24 * 60 * 60 * 1000;

function makeGoal(
    overrides: {
        status?: EGoalStatus;
        current?: string;
        deadline?: GoalDeadline;
    } = {},
): Goal {
    const created = new Date(Date.now() - 10 * DAY);
    return new Goal(
        'goal-1',
        {
            userId: 'user-1',
            name: new Name('Viagem'),
            targetAmount: Money.fromAmount('100.00'),
            currentAmount: Money.fromAmount(overrides.current ?? '0.00'),
            deadline:
                overrides.deadline ??
                new GoalDeadline(new Date(created.getTime() + 2 * DAY), created),
            status: new GoalStatus(overrides.status ?? EGoalStatus.IN_PROGRESS),
        },
        created,
        created,
    );
}

describe('Goal', () => {
    it('expira automaticamente quando o prazo foi atingido (RN11)', () => {
        const goal = makeGoal();
        expect(goal.expireIfDeadlineReached(new Date())).toBe(true);
        expect(goal.isExpired()).toBe(true);
    });

    it('não expira antes do prazo', () => {
        const goal = makeGoal();
        const before = new Date(Date.now() - 9 * DAY);
        expect(goal.expireIfDeadlineReached(before)).toBe(false);
        expect(goal.isInProgress()).toBe(true);
    });

    it('meta expirada não recebe aportes (RN12)', () => {
        const goal = makeGoal({ status: EGoalStatus.EXPIRED });
        expect(() => goal.contribute(Money.fromAmount('10.00'))).toThrow();
    });

    it('meta expirada pode ser reativada com novo prazo', () => {
        const goal = makeGoal({ status: EGoalStatus.EXPIRED });
        const now = new Date();
        goal.reactivate(new GoalDeadline(new Date(now.getTime() + 2 * DAY), now));
        expect(goal.isInProgress()).toBe(true);
    });

    it('somente metas expiradas podem ser reativadas', () => {
        const goal = makeGoal();
        expect(() => goal.reactivate()).toThrow();
    });

    it('aporte que atinge o alvo conclui a meta', () => {
        const goal = makeGoal();
        goal.contribute(Money.fromAmount('100.00'));
        expect(goal.isCompleted()).toBe(true);
    });

    it('retirada em meta concluída volta para em andamento', () => {
        const goal = makeGoal({ status: EGoalStatus.COMPLETED, current: '100.00' });
        goal.withdraw(Money.fromAmount('10.00'));
        expect(goal.isInProgress()).toBe(true);
    });

    it('não permite retirar mais que o saldo da meta', () => {
        const goal = makeGoal({ current: '5.00' });
        expect(() => goal.withdraw(Money.fromAmount('6.00'))).toThrow();
    });

    it('cancelar zera o saldo e marca como cancelada; cancelar de novo falha', () => {
        const goal = makeGoal({ current: '20.00' });
        goal.cancel();
        expect(goal.isCancelled()).toBe(true);
        expect(goal.currentAmount.isGreaterThan(Money.zero())).toBe(false);
        expect(() => goal.validateCancellation()).toThrow();
    });
});
