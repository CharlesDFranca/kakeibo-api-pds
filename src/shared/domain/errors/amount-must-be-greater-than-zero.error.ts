import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';

export class AmountMustBeGreaterThanZeroError extends DomainError {
    readonly code = ErrorCodes.AMOUNT_MUST_BE_GREATER_THAN_ZERO;

    constructor() {
        super('The amount must be greater than zero.');
    }
}
