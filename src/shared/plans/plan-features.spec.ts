import { EFeature } from './feature.enum';
import { EPlan } from './plan.enum';
import { featuresOf, minimumPlanFor, planAllows } from './plan-features';

describe('PLAN_FEATURES (Tabela 28)', () => {
    it('Free não libera nenhuma funcionalidade restrita', () => {
        expect(featuresOf(EPlan.FREE)).toEqual([]);
    });

    it('Plus libera transferências e análise por categoria', () => {
        expect(planAllows(EPlan.PLUS, EFeature.TRANSFERS)).toBe(true);
        expect(planAllows(EPlan.PLUS, EFeature.CATEGORY_ANALYSIS)).toBe(true);
        expect(planAllows(EPlan.PLUS, EFeature.GOALS)).toBe(false);
        expect(planAllows(EPlan.PLUS, EFeature.NOTIFICATIONS)).toBe(false);
    });

    it('Pro libera tudo', () => {
        for (const feature of Object.values(EFeature)) {
            expect(planAllows(EPlan.PRO, feature)).toBe(true);
        }
    });

    it('cada plano contém as funcionalidades do plano anterior', () => {
        const order = [EPlan.FREE, EPlan.PLUS, EPlan.PRO];

        for (let i = 1; i < order.length; i++) {
            for (const feature of featuresOf(order[i - 1] as EPlan)) {
                expect(planAllows(order[i] as EPlan, feature)).toBe(true);
            }
        }
    });

    it('informa o menor plano que libera cada funcionalidade', () => {
        expect(minimumPlanFor(EFeature.TRANSFERS)).toBe(EPlan.PLUS);
        expect(minimumPlanFor(EFeature.CATEGORY_ANALYSIS)).toBe(EPlan.PLUS);
        expect(minimumPlanFor(EFeature.GOALS)).toBe(EPlan.PRO);
    });
});
