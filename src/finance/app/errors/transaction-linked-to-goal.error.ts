import { ErrorCodes } from '@/shared/errors/error-codes';
import { AppError } from '@/shared/errors/types/app-error';

export class TransactionLinkedToGoalError extends AppError {
    readonly code = ErrorCodes.TRANSACTION_LINKED_TO_GOAL;

    constructor() {
        super('A transaction linked to a goal movement cannot be deleted.');
    }
}
