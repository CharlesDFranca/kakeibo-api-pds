import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';

export class TransactionCannotBeDeletedError extends DomainError {
    readonly code = ErrorCodes.TRANSACTION_CANNOT_BE_DELETED;

    constructor() {
        super(
            'Only income and expense transactions can be deleted. Transfers must be reverted instead.',
        );
    }
}
