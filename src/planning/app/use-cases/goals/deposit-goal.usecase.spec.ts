import { DepositGoalUseCase } from './deposit-goal.usecase';
import { Goal } from '@/planning/domain/entities/goal.entity';
import { GoalMovement } from '@/planning/domain/entities/goal-movement.entity';
import { GoalStatus } from '@/planning/domain/value-objects/goal-status.vo';
import { GoalDeadline } from '@/planning/domain/value-objects/goal-deadline.vo';
import { EGoalStatus } from '@/planning/domain/enums/goal-status.enum';
import { GoalReachedEvent } from '@/planning/domain/events/goal-reached.event';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { InMemoryEventBus } from '@/shared/events/in-memory-event-bus';
import { SequentialIdGenerator } from '@/finance/testing/in-memory-finance';
import type { IPlanningUnitOfWork } from '../../contracts/planning-unit-of-work.contract';
import type { IFinanceFacade } from '@/finance/api/finance-facade.api';
import { GoalNotFoundError } from '../../errors/goal-not-found.error';

const DAY = 24 * 60 * 60 * 1000;

function makeGoal(current = '0.00'): Goal {
    const now = new Date();
    return new Goal(
        'g1',
        {
            userId: 'user-1',
            name: new Name('Viagem'),
            targetAmount: Money.fromAmount('100.00'),
            currentAmount: Money.fromAmount(current),
            deadline: new GoalDeadline(new Date(now.getTime() + 30 * DAY), now),
            status: new GoalStatus(EGoalStatus.IN_PROGRESS),
        },
        now,
        now,
    );
}

describe('DepositGoalUseCase – eventos (6.3.3)', () => {
    let goals: Map<string, Goal>;
    let movements: GoalMovement[];
    let bus: InMemoryEventBus;
    let withdrawals: number;
    let useCase: DepositGoalUseCase;

    beforeEach(() => {
        goals = new Map([['g1', makeGoal('90.00')]]);
        movements = [];
        withdrawals = 0;
        bus = new InMemoryEventBus();

        const uow = {
            transaction: <T>(work: () => Promise<T>) => work(),
            getGoalRepository: () => ({
                findUserGoalById: (_u: string, id: string) =>
                    Promise.resolve(goals.get(id) ?? null),
                update: (g: Goal) => {
                    goals.set(g.id, g);
                    return Promise.resolve();
                },
            }),
            getGoalMovementRepository: () => ({
                create: (m: GoalMovement) => {
                    movements.push(m);
                    return Promise.resolve();
                },
            }),
        } as unknown as IPlanningUnitOfWork;

        const facade = {
            withdrawFromWallet: () => {
                withdrawals++;
                return Promise.resolve({ transactionId: 'tx-1' });
            },
        } as unknown as IFinanceFacade;

        useCase = new DepositGoalUseCase(
            uow,
            new SequentialIdGenerator(),
            facade,
            bus,
        );
    });

    it('publica GoalReachedEvent quando o aporte completa a meta', async () => {
        await useCase.execute({
            userId: 'user-1',
            walletId: 'w1',
            goalId: 'g1',
            amount: '50.00',
        });

        expect(goals.get('g1')?.isCompleted()).toBe(true);
        expect(bus.published.length).toBe(1);
        const event = bus.published[0] as GoalReachedEvent;
        expect(event instanceof GoalReachedEvent).toBe(true);
        expect(event.goalId).toBe('g1');
        expect(event.goalName).toBe('Viagem');
        expect(event.targetAmount).toBe('100.00');
    });

    it('não publica evento quando a meta ainda não foi atingida', async () => {
        await useCase.execute({
            userId: 'user-1',
            walletId: 'w1',
            goalId: 'g1',
            amount: '5.00',
        });

        expect(goals.get('g1')?.isCompleted()).toBe(false);
        expect(bus.published.length).toBe(0);
        expect(movements.length).toBe(1);
    });

    it('não publica evento quando o aporte falha', async () => {
        await expect(
            useCase.execute({
                userId: 'user-1',
                walletId: 'w1',
                goalId: 'nope',
                amount: '5.00',
            }),
        ).rejects.toThrow(GoalNotFoundError);

        expect(withdrawals).toBe(0);
        expect(bus.published.length).toBe(0);
    });
});
