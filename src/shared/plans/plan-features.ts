import { EFeature } from './feature.enum';
import { EPlan } from './plan.enum';

/** Fonte única do que cada plano libera (Tabela 28 do documento). */
export const PLAN_FEATURES: Record<EPlan, readonly EFeature[]> = {
    [EPlan.FREE]: [],
    [EPlan.PLUS]: [EFeature.TRANSFERS, EFeature.CATEGORY_ANALYSIS],
    [EPlan.PRO]: [
        EFeature.TRANSFERS,
        EFeature.CATEGORY_ANALYSIS,
        EFeature.GOALS,
        EFeature.NOTIFICATIONS,
    ],
};

export function planAllows(plan: EPlan, feature: EFeature): boolean {
    return PLAN_FEATURES[plan].includes(feature);
}

/** Menor plano que libera a funcionalidade (usado na mensagem de erro). */
export function minimumPlanFor(feature: EFeature): EPlan {
    const order = [EPlan.FREE, EPlan.PLUS, EPlan.PRO];

    return order.find((plan) => planAllows(plan, feature)) ?? EPlan.PRO;
}

export function featuresOf(plan: EPlan): EFeature[] {
    return [...PLAN_FEATURES[plan]];
}
