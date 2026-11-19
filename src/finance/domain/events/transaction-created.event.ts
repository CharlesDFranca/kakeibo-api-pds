import { DomainEvent } from '@/shared/events/domain-event';
import type { ETransactionType } from '../enums/transaction-type.enum';

export const TRANSACTION_CREATED_EVENT = 'finance.transaction.created';

/** Publicado pelo contexto Financeiro após registrar uma receita ou despesa. */
export class TransactionCreatedEvent extends DomainEvent {
    constructor(
        public readonly transactionId: string,
        public readonly userId: string,
        public readonly walletId: string,
        public readonly categoryId: string,
        public readonly type: ETransactionType,
        public readonly amount: string,
        public readonly date: Date,
    ) {
        super();
    }

    get name(): string {
        return TRANSACTION_CREATED_EVENT;
    }
}
