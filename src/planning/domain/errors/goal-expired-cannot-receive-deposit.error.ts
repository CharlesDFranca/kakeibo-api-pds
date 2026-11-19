import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';

export class GoalExpiredCannotReceiveDepositError extends DomainError {
    readonly code = ErrorCodes.GOAL_EXPIRED_CANNOT_RECEIVE_DEPOSIT;

    constructor() {
        super('The goal has expired and cannot receive new deposits.');
    }
}
