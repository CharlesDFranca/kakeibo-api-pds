import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';

export class TransactionTypeNotAllowedError extends DomainError {
    readonly code = ErrorCodes.TRANSACTION_TYPE_NOT_ALLOWED;

    constructor() {
        super('Only INCOME and EXPENSE transactions can be registered.');
    }
}
