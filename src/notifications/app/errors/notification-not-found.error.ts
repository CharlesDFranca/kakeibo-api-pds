import { ErrorCodes } from '@/shared/errors/error-codes';
import { AppError } from '@/shared/errors/types/app-error';

export class NotificationNotFoundError extends AppError {
    readonly code = ErrorCodes.NOTIFICATION_NOT_FOUND;

    constructor() {
        super('Notification not found.');
    }
}
