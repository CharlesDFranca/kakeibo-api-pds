import { ErrorCodes } from '@/shared/errors/error-codes';
import { DomainError } from '@/shared/errors/types/domain-error';
import { EFeature } from '@/shared/plans/feature.enum';
import { minimumPlanFor } from '@/shared/plans/plan-features';

export class FeatureNotAvailableInPlanError extends DomainError {
    readonly code = ErrorCodes.FEATURE_NOT_AVAILABLE_IN_PLAN;

    constructor(feature: EFeature) {
        super(
            `The feature ${feature} is not available in your plan. Upgrade to ${minimumPlanFor(feature)} or higher.`,
        );
    }
}
