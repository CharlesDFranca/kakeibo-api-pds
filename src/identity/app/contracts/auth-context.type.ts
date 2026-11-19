import { EPlan } from '@/shared/plans/plan.enum';

export type AuthContext = {
    sessionId: string;
    userId: string;
    plan: EPlan;
};
