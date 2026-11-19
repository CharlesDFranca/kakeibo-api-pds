import { BaseEntity } from '@/shared/domain/entities/base-entity.entity';
import { TransactionType } from '../value-objects/transaction-type.vo';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { InvalidTransactionDateError } from '../errors/invalid-transaction-date.error';
import { ETransactionDirection } from '../enums/transaction-direction.enum';
import { AmountMustBeGreaterThanZeroError } from '@/shared/domain/errors/amount-must-be-greater-than-zero.error';
import { ETransactionType } from '../enums/transaction-type.enum';
import { TransactionTypeNotAllowedError } from '../errors/transaction-type-not-allowed.error';

type TransactionProps = {
    description: string;
    amount: Money;
    type: TransactionType;
    date: Date;
    walletId: string;
    categoryId: string;
    /** Obrigatório em movimentações novas do tipo TRANSFER (opcional em dados legados). */
    direction?: ETransactionDirection;
};

/** Dados para criar uma receita ou despesa informada pelo usuário. */
export type RegisterTransactionData = {
    description: string;
    amount: Money;
    type: TransactionType;
    date: Date;
    walletId: string;
    categoryId: string;
};

/** Dados comuns às duas pontas de uma transferência. */
export type TransferLegData = {
    walletId: string;
    categoryId: string;
    amount: Money;
    /** Padrão: "Transfer". */
    description?: string;
};

/** Efeito de uma transação no saldo da carteira (CREDIT soma, DEBIT subtrai). */
export type BalanceImpact = {
    effect: 'CREDIT' | 'DEBIT' | 'NONE';
    amount: Money;
};

export class Transaction extends BaseEntity<TransactionProps> {
    constructor(
        id: string,
        props: TransactionProps,
        createdAt: Date,
        updatedAt: Date,
    ) {
        super(id, props, createdAt, updatedAt);

        if (!this.isValidDate(props.date)) {
            throw new InvalidTransactionDateError(props.date);
        }

        if (props.amount.isZero() && !props.type.isOpeningBalance()) {
            throw new AmountMustBeGreaterThanZeroError();
        }
    }

    //#region Factories
    // Cada tipo de transação nasce por um método nomeado: o chamador diz a
    // intenção (receita, saldo inicial, ponta de transferência) e a entidade
    // decide descrição padrão, direção e regras de criação (GRASP Creator).

    /** Receita ou despesa informada pelo usuário. Outros tipos são recusados. */
    public static register(
        id: string,
        data: RegisterTransactionData,
        now: Date,
    ): Transaction {
        if (!data.type.isIncome() && !data.type.isExpense()) {
            throw new TransactionTypeNotAllowedError();
        }

        return new Transaction(
            id,
            {
                description: data.description,
                amount: data.amount,
                type: data.type,
                date: data.date,
                walletId: data.walletId,
                categoryId: data.categoryId,
            },
            now,
            now,
        );
    }

    /** Lançamento que registra o saldo inicial de uma carteira nova. */
    public static openingBalance(
        id: string,
        data: { walletId: string; categoryId: string; amount: Money },
        now: Date,
    ): Transaction {
        return new Transaction(
            id,
            {
                description: 'Opening balance',
                amount: data.amount,
                type: new TransactionType(ETransactionType.OPENING_BALANCE),
                date: now,
                walletId: data.walletId,
                categoryId: data.categoryId,
            },
            now,
            now,
        );
    }

    /** Ponta de saída de uma transferência (debita a carteira). */
    public static transferOut(
        id: string,
        data: TransferLegData,
        date: Date,
    ): Transaction {
        return Transaction.transferLeg(id, data, ETransactionDirection.OUT, date);
    }

    /** Ponta de entrada de uma transferência (credita a carteira). */
    public static transferIn(
        id: string,
        data: TransferLegData,
        date: Date,
    ): Transaction {
        return Transaction.transferLeg(id, data, ETransactionDirection.IN, date);
    }

    /** Ponta de transferência cujo sentido só é conhecido em tempo de execução. */
    public static transferLeg(
        id: string,
        data: TransferLegData,
        direction: ETransactionDirection,
        date: Date,
    ): Transaction {
        return new Transaction(
            id,
            {
                description: data.description ?? 'Transfer',
                amount: data.amount,
                type: new TransactionType(ETransactionType.TRANSFER),
                direction,
                date,
                walletId: data.walletId,
                categoryId: data.categoryId,
            },
            date,
            date,
        );
    }
    //#endregion

    //#region Getters
    public get description(): string {
        return this.props.description;
    }

    public get amount(): Money {
        return this.props.amount;
    }

    public get type(): TransactionType {
        return this.props.type;
    }

    public get date(): Date {
        return this.props.date;
    }

    public get walletId(): string {
        return this.props.walletId;
    }

    public get categoryId(): string {
        return this.props.categoryId;
    }

    public get direction(): ETransactionDirection | undefined {
        return this.props.direction;
    }

    //#endregion

    public isIncome(): boolean {
        return this.type.isIncome();
    }

    public isExpense(): boolean {
        return this.type.isExpense();
    }

    public isTransfer(): boolean {
        return this.type.isTransfer();
    }

    public isOpeningBalance(): boolean {
        return this.type.isOpeningBalance();
    }

    public isAdjustment(): boolean {
        return this.type.isAdjustment();
    }

    /**
     * calcularImpactoNoSaldo (US18): quanto a transação alterou o saldo da
     * carteira e em que sentido. Saldo inicial e receita somam, despesa
     * subtrai e movimentações TRANSFER seguem o seu `direction`. Um ajuste, ou
     * uma movimentação legada sem sentido, não tem efeito calculável (NONE).
     */
    public calculateBalanceImpact(): BalanceImpact {
        const amount = this.amount;

        if (this.isIncome() || this.isOpeningBalance()) {
            return { effect: 'CREDIT', amount };
        }

        if (this.isExpense()) return { effect: 'DEBIT', amount };

        if (this.isTransfer() && this.direction === ETransactionDirection.IN) {
            return { effect: 'CREDIT', amount };
        }

        if (this.isTransfer() && this.direction === ETransactionDirection.OUT) {
            return { effect: 'DEBIT', amount };
        }

        return { effect: 'NONE', amount };
    }

    /**
     * Only manually registered income/expense transactions may be deleted.
     * Transfer legs belong to a Transfer (which has its own revert flow) and
     * opening balance/adjustments are system-generated wallet history.
     */
    public canBeDeleted(): boolean {
        return this.isIncome() || this.isExpense();
    }
}
