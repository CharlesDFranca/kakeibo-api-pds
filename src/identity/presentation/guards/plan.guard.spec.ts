import { PlanGuard } from './plan.guard';
import { EPlan } from '@/shared/plans/plan.enum';
import { EFeature } from '@/shared/plans/feature.enum';
import { FeatureNotAvailableInPlanError } from '@/shared/domain/errors/feature-not-available-in-plan.error';
import { ErrorCodes } from '@/shared/errors/error-codes';

function makeGuard(feature: EFeature | undefined) {
    const reflector = { getAllAndOverride: () => feature };
    return new PlanGuard(reflector as never);
}

function makeContext(plan: EPlan | undefined) {
    return {
        getHandler: () => undefined,
        getClass: () => undefined,
        switchToHttp: () => ({
            getRequest: () => ({ auth: plan ? { plan } : undefined }),
        }),
    } as never;
}

describe('PlanGuard', () => {
    it('rotas sem @RequiresFeature (inclusive públicas) passam', () => {
        expect(makeGuard(undefined).canActivate(makeContext(undefined))).toBe(true);
    });

    it('Free é barrado em transferências e metas', () => {
        for (const feature of [EFeature.TRANSFERS, EFeature.GOALS]) {
            expect(() =>
                makeGuard(feature).canActivate(makeContext(EPlan.FREE)),
            ).toThrow(FeatureNotAvailableInPlanError);
        }
    });

    it('Plus acessa transferências, mas não metas', () => {
        expect(
            makeGuard(EFeature.TRANSFERS).canActivate(makeContext(EPlan.PLUS)),
        ).toBe(true);
        expect(() =>
            makeGuard(EFeature.GOALS).canActivate(makeContext(EPlan.PLUS)),
        ).toThrow(FeatureNotAvailableInPlanError);
    });

    it('Pro acessa metas', () => {
        expect(
            makeGuard(EFeature.GOALS).canActivate(makeContext(EPlan.PRO)),
        ).toBe(true);
    });

    it('o erro indica o plano mínimo e tem o código esperado', () => {
        const error = new FeatureNotAvailableInPlanError(EFeature.GOALS);

        expect(error.code).toBe(ErrorCodes.FEATURE_NOT_AVAILABLE_IN_PLAN);
        expect(error.message.includes('PRO')).toBe(true);
    });
});
