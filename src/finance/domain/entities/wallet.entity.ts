import { BaseEntity } from '@/shared/domain/entities/base-entity.entity';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { InsufficientWalletBalanceError } from '../errors/insufficient-wallet-balance.error';
import { TransactionCannotBeDeletedError } from '../errors/transaction-cannot-be-deleted.error';
import { Transaction } from './transaction.entity';

type WalletProps = {
    userId: string;
    name: Name;
    balance: Money;
};

export class Wallet extends BaseEntity<WalletProps> {
    constructor(
        id: string,
        props: WalletProps,
        createdAt: Date,
        updatedAt: Date,
    ) {
        super(id, props, createdAt, updatedAt);
    }

    public get name(): Name {
        return this.props.name;
    }

    public get balance(): Money {
        return this.props.balance;
    }

    public get userId(): string {
        return this.props.userId;
    }

    public rename(name: Name): void {
        if (this.name.equals(name)) return;

        this.props.name = name;
        this.touch();
    }

    public deposit(amount: Money): void {
        this.props.balance = this.balance.add(amount);
        this.touch();
    }

    public withdraw(amount: Money) {
        if (!this.canWithdraw(amount)) {
            throw new InsufficientWalletBalanceError();
        }

        this.props.balance = this.balance.subtract(amount);
        this.touch();
    }

    public canWithdraw(amount: Money): boolean {
        return this.props.balance.isGreaterThanOrEqual(amount);
    }

    /**
     * Checks whether the balance can absorb the removal of a transaction
     * without becoming negative (RN15). Removing a credit takes the amount
     * back out of the wallet; removing a debit returns it.
     */
    public canAdjustBalanceForDeletionOf(transaction: Transaction): boolean {
        const { effect, amount } = transaction.calculateBalanceImpact();

        if (effect === 'CREDIT') return this.canWithdraw(amount);

        return effect === 'DEBIT';
    }

    /** validarAjusteSaldo (US18): falha se a exclusão geraria saldo inválido. */
    public validateBalanceAdjustmentForDeletionOf(
        transaction: Transaction,
    ): void {
        if (!this.canAdjustBalanceForDeletionOf(transaction)) {
            throw new InsufficientWalletBalanceError();
        }
    }

    /** ajustarSaldoParaExclusao (US18): desfaz o efeito da transação no saldo. */
    public adjustBalanceForDeletionOf(transaction: Transaction): void {
        const { effect, amount } = transaction.calculateBalanceImpact();

        if (effect === 'CREDIT') {
            this.withdraw(amount);
            return;
        }

        if (effect === 'DEBIT') {
            this.deposit(amount);
            return;
        }

        throw new TransactionCannotBeDeletedError();
    }
}
