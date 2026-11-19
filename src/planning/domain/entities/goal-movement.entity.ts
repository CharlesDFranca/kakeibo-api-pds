import { BaseEntity } from '@/shared/domain/entities/base-entity.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { GoalMovementType } from '../value-objects/goal-movement-type.vo';
import { EGoalMovementType } from '../enums/goal-movement-type.enum';
import { GoalMovementAmountMustBeGreaterThanZeroError } from '../errors/goal-movement-amount-must-be-greater-than-zero.error';

type GoalMovementProps = {
    walletId: string;
    goalId: string;
    type: GoalMovementType;
    amount: Money;
    transactionId?: string | undefined;
    revertedDepositId?: string | undefined;
};

export class GoalMovement extends BaseEntity<GoalMovementProps> {
    constructor(
        id: string,
        props: GoalMovementProps,
        createdAt: Date,
        updatedAt: Date,
    ) {
        super(id, props, createdAt, updatedAt);

        if (props.amount.isZero()) {
            throw new GoalMovementAmountMustBeGreaterThanZeroError();
        }
    }

    //#region Factories

    /** Aporte de uma carteira na meta. */
    public static deposit(
        id: string,
        data: {
            goalId: string;
            walletId: string;
            transactionId: string;
            amount: Money;
        },
        now: Date,
    ): GoalMovement {
        return new GoalMovement(
            id,
            { ...data, type: new GoalMovementType(EGoalMovementType.DEPOSIT) },
            now,
            now,
        );
    }

    /**
     * Movimentação compensatória que desfaz um aporte (RN13): mesmo valor,
     * meta e carteira do aporte original, apontando para ele.
     */
    public static reversalOf(
        deposit: GoalMovement,
        id: string,
        transactionId: string,
        now: Date,
    ): GoalMovement {
        return new GoalMovement(
            id,
            {
                goalId: deposit.goalId,
                walletId: deposit.walletId,
                amount: deposit.amount,
                transactionId,
                revertedDepositId: deposit.id,
                type: new GoalMovementType(EGoalMovementType.WITHDRAW),
            },
            now,
            now,
        );
    }
    //#endregion

    public get goalId(): string {
        return this.props.goalId;
    }

    public get walletId(): string {
        return this.props.walletId;
    }

    public get amount(): Money {
        return this.props.amount;
    }

    public get type(): GoalMovementType {
        return this.props.type;
    }

    public get transactionId(): string | undefined {
        return this.props.transactionId;
    }

    public get revertedDepositId(): string | undefined {
        return this.props.revertedDepositId;
    }

    /**
     * Only deposits can be reverted. Whether a deposit has already been
     * reverted is checked through its compensating movement (RN13).
     */
    public canRevert(): boolean {
        return this.isDeposit();
    }

    public isDeposit(): boolean {
        return this.type.isDeposit();
    }

    public isWithdraw(): boolean {
        return this.type.isWithdraw();
    }
}
