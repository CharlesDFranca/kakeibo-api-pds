import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';

export class SystemCategoryCannotBeRenamedError extends DomainError {
    readonly code = ErrorCodes.SYSTEM_CATEGORY_CANNOT_BE_RENAMED;

    constructor() {
        super('System categories cannot be renamed');
    }
}
