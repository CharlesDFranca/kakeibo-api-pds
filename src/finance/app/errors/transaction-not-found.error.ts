import { ErrorCodes } from '@/shared/errors/error-codes';
import { AppError } from '@/shared/errors/types/app-error';

export class TransactionNotFoundError extends AppError {
    readonly code = ErrorCodes.TRANSACTION_NOT_FOUND;

    constructor() {
        super('Transaction not found.');
    }
}
