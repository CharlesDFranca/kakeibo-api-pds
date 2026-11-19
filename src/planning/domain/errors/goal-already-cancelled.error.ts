import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';

export class GoalAlreadyCancelledError extends DomainError {
    readonly code = ErrorCodes.GOAL_ALREADY_CANCELLED;

    constructor() {
        super('The goal has already been cancelled.');
    }
}
