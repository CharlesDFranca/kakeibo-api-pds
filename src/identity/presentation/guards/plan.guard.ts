import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { REQUIRES_FEATURE_KEY } from '@/core/decorators/requires-feature.decorator';
import { FeatureNotAvailableInPlanError } from '@/shared/domain/errors/feature-not-available-in-plan.error';
import { EFeature } from '@/shared/plans/feature.enum';
import { planAllows } from '@/shared/plans/plan-features';

/**
 * Aplica `@RequiresFeature`. Precisa rodar depois do SessionGuard, que
 * preenche `request.auth` (com o plano atual do usuário).
 */
@Injectable()
export class PlanGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const feature = this.reflector.getAllAndOverride<EFeature | undefined>(
            REQUIRES_FEATURE_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!feature) return true;

        const request = context.switchToHttp().getRequest<Request>();

        if (!planAllows(request.auth.plan, feature)) {
            throw new FeatureNotAvailableInPlanError(feature);
        }

        return true;
    }
}
