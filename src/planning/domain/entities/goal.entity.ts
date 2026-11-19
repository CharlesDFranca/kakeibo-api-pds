import { BaseEntity } from '@/shared/domain/entities/base-entity.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';

import { GoalDeadline } from '../value-objects/goal-deadline.vo';
import { GoalStatus } from '../value-objects/goal-status.vo';
import { goalStateFor, type GoalContext, type GoalState } from './goal-state';
import { EGoalStatus } from '../enums/goal-status.enum';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { GoalCurrentAmountCannotExceedTargetError } from '../errors/goal-current-amount-cannot-exceed-target-error';

type GoalProps = {
    userId: string;
    name: Name;
    targetAmount: Money;
    currentAmount: Money;
    deadline?: GoalDeadline | undefined;
    status: GoalStatus;
};

export class Goal extends BaseEntity<GoalProps> {
    constructor(
        id: string,
        props: GoalProps,
        createdAt: Date,
        updatedAt: Date,
    ) {
        super(id, props, createdAt, updatedAt);

        this.ensureValidAmounts();
    }

    public get name(): Name {
        return this.props.name;
    }

    public get userId(): string {
        return this.props.userId;
    }

    public get targetAmount(): Money {
        return this.props.targetAmount;
    }

    public get currentAmount(): Money {
        return this.props.currentAmount;
    }

    public get deadline(): GoalDeadline | undefined {
        return this.props.deadline;
    }

    public get status(): GoalStatus {
        return this.props.status;
    }

    public isCompleted(): boolean {
        return this.status.isCompleted();
    }

    public isInProgress(): boolean {
        return this.status.isInProgress();
    }

    public isExpired(): boolean {
        return this.status.isExpired();
    }

    public isCancelled(): boolean {
        return this.status.isCancelled();
    }

    public necessaryToComplete(): Money {
        return this.currentAmount.isGreaterThanOrEqual(this.targetAmount)
            ? Money.zero()
            : this.targetAmount.subtract(this.currentAmount);
    }

    public rename(name: Name): void {
        if (this.name.equals(name)) return;

        this.props.name = name;
        this.touch();
    }

    // ---- Transições: quem decide é o estado atual (padrão State) ----

    public contribute(amount: Money): void {
        this.state.contribute(this.context, amount);
    }

    public withdraw(amount: Money): void {
        this.state.withdraw(this.context, amount);
    }

    public complete(): void {
        this.state.complete(this.context);
    }

    public activate(): void {
        this.transitionTo(EGoalStatus.IN_PROGRESS);
        this.touch();
    }

    public reactivate(deadline?: GoalDeadline): void {
        this.state.reactivate(this.context, deadline);
    }

    public expire(): void {
        this.state.expire(this.context);
    }

    /**
     * RN11 – a goal that reached its deadline is automatically expired.
     * Returns true when the status was changed by this call.
     */
    public expireIfDeadlineReached(now: Date = new Date()): boolean {
        return this.state.expireIfDeadlineReached(this.context, now);
    }

    public validateCancellation(): void {
        this.state.validateCancellation();
    }

    public cancel(): void {
        this.state.cancel(this.context);
    }

    public updateTarget(amount: Money): void {
        this.state.updateTarget(this.context, amount);
    }

    public updateDeadline(deadline?: GoalDeadline): void {
        this.state.updateDeadline(this.context, deadline);
    }

    /** Estado derivado do status persistido. */
    private get state(): GoalState {
        return goalStateFor(this.props.status.value);
    }

    private transitionTo(status: EGoalStatus): void {
        this.props.status = new GoalStatus(status);
    }

    /** Visão restrita da meta oferecida aos estados. */
    private get context(): GoalContext {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const goal = this;
        return {
            get currentAmount() {
                return goal.props.currentAmount;
            },
            get targetAmount() {
                return goal.props.targetAmount;
            },
            get deadline() {
                return goal.props.deadline;
            },
            setCurrentAmount: (amount) => {
                goal.props.currentAmount = amount;
            },
            setTargetAmount: (amount) => {
                goal.props.targetAmount = amount;
            },
            setDeadline: (deadline) => {
                goal.props.deadline = deadline;
            },
            transitionTo: (status) => goal.transitionTo(status),
            touch: () => goal.touch(),
        };
    }

    private ensureValidAmounts(): void {
        if (this.currentAmount.isGreaterThan(this.targetAmount)) {
            throw new GoalCurrentAmountCannotExceedTargetError();
        }
    }
}
