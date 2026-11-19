import { Inject, Injectable } from '@nestjs/common';

import { PLANNING_TOKENS } from '@/planning/planning.tokens';
import type { IPlanningDashboardQuery } from '../../contracts/planning-dashboard-query.interface';

type GetPlanningDashboardInput = {
    userId: string;
};

type GetPlanningDashboardOutput = {
    id: string;
    name: string;
    currentAmount: string;
    targetAmount: string;
    percentage: number;
    deadline: Date | null;
}[];

@Injectable()
export class GetPlanningDashboardUseCase {
    private readonly limit = 3;

    constructor(
        @Inject(PLANNING_TOKENS.PLANNING_DASHBOARD_QUERY)
        private readonly planningDashboardQuery: IPlanningDashboardQuery,
    ) {}

    async execute(
        input: GetPlanningDashboardInput,
    ): Promise<GetPlanningDashboardOutput> {
        const goals = await this.planningDashboardQuery.findForDashboard(
            input.userId,
            this.limit,
        );

        // Valores monetários saem como texto ("50.00"), igual ao resto da API.
        return goals.map((goal) => ({
            ...goal,
            currentAmount: goal.currentAmount.amount,
            targetAmount: goal.targetAmount.amount,
        }));
    }
}
