import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';

export class GoalDepositAlreadyRevertedError extends DomainError {
    readonly code = ErrorCodes.GOAL_DEPOSIT_ALREADY_REVERTED;

    constructor() {
        super('This deposit has already been reverted.');
    }
}
