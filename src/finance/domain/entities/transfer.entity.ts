import { BaseEntity } from '@/shared/domain/entities/base-entity.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { CannotTransferToSameWalletError } from '../errors/cannot-transfer-to-same-wallet.error';
import { ETransferStatus } from '../enums/transfer-status.enum';
import { AmountMustBeGreaterThanZeroError } from '@/shared/domain/errors/amount-must-be-greater-than-zero.error';

type TransferProps = {
    amount: Money;
    sourceWalletId: string;
    destinationWalletId: string;
    sourceTransactionId: string;
    destinationTransactionId: string;
    status: ETransferStatus;
};

export class Transfer extends BaseEntity<TransferProps> {
    constructor(
        id: string,
        props: TransferProps,
        createdAt: Date,
        updatedAt: Date,
    ) {
        if (props.sourceWalletId === props.destinationWalletId) {
            throw new CannotTransferToSameWalletError();
        }

        if (props.amount.isZero()) {
            throw new AmountMustBeGreaterThanZeroError();
        }

        super(id, props, createdAt, updatedAt);
    }

    public get amount(): Money {
        return this.props.amount;
    }

    public get sourceWalletId(): string {
        return this.props.sourceWalletId;
    }

    public get destinationWalletId(): string {
        return this.props.destinationWalletId;
    }

    public get sourceTransactionId(): string {
        return this.props.sourceTransactionId;
    }

    public get destinationTransactionId(): string {
        return this.props.destinationTransactionId;
    }

    public get status(): ETransferStatus {
        return this.props.status;
    }

    public revert(): void {
        if (!this.canRevert()) return;

        this.props.status = ETransferStatus.REVERTED;
        this.touch();
    }

    public canRevert(): boolean {
        return this.status === ETransferStatus.COMPLETED;
    }
}
