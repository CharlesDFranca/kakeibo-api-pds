import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '@/core/core.module';
import { FinanceModule } from '@/finance/finance.module';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import type { IFundsAllocationRegistry } from '@/finance/app/contracts/funds-allocation.contract';

import { PLANNING_TOKENS } from './planning.tokens';
import { GoalController } from './presentation/controllers/goal.controller';
import { GoalMovementController } from './presentation/controllers/goal-movement.controller';

import {
    CreateGoalUseCase,
    RenameGoalUseCase,
    ListGoalsUseCase,
    DepositGoalUseCase,
    ReverseGoalDepositUseCase,
    CancelGoalUseCase,
    FindGoalByIdUseCase,
    ReactivateGoalUseCase,
} from './app/use-cases/goals';

import { GoalEntity } from './infra/entities/typeorm-goal.entity';
import { GoalMovementEntity } from './infra/entities/typeorm-goal-movement.entity';
import { TypeOrmGoalRepository } from './infra/repositories/typeorm-goal.repository';
import { TypeOrmGoalMovementRepository } from './infra/repositories/typeorm-goal-movement.repository';
import { TypeOrmPlanningUnitOfWork } from './infra/database/typeorm-planning.uow';
import { GoalFundsAllocationSource } from './app/services/goal-funds-allocation.source';
import { TypeOrmPlanningDashboardQuery } from './infra/queries/typeorm-planning-dashboard.query';
import { PlanningController } from './presentation/controllers/planning.controller';
import { GetPlanningDashboardUseCase } from './app/use-cases/dashboard/get-planning-dashboard.usecase';

@Module({
    imports: [
        CoreModule,
        FinanceModule,
        TypeOrmModule.forFeature([GoalEntity, GoalMovementEntity]),
    ],
    controllers: [PlanningController, GoalController, GoalMovementController],
    providers: [
        CreateGoalUseCase,
        RenameGoalUseCase,
        ListGoalsUseCase,
        DepositGoalUseCase,
        ReverseGoalDepositUseCase,
        CancelGoalUseCase,
        FindGoalByIdUseCase,
        ReactivateGoalUseCase,
        GetPlanningDashboardUseCase,

        {
            provide: PLANNING_TOKENS.GOAL_REPOSITORY,
            useClass: TypeOrmGoalRepository,
        },
        {
            provide: PLANNING_TOKENS.GOAL_MOVEMENT_REPOSITORY,
            useClass: TypeOrmGoalMovementRepository,
        },
        {
            provide: PLANNING_TOKENS.UNIT_OF_WORK,
            useClass: TypeOrmPlanningUnitOfWork,
        },

        GoalFundsAllocationSource,
        {
            provide: PLANNING_TOKENS.PLANNING_DASHBOARD_QUERY,
            useClass: TypeOrmPlanningDashboardQuery,
        },
    ],
})
export class PlanningModule implements OnModuleInit {
    constructor(
        @Inject(FINANCE_TOKENS.FUNDS_ALLOCATION)
        private readonly fundsAllocation: IFundsAllocationRegistry,
        private readonly goalFunds: GoalFundsAllocationSource,
    ) {}

    /** Planning se registra no Finance: a dependência aponta para o Finance. */
    onModuleInit(): void {
        this.fundsAllocation.register(this.goalFunds);
    }
}
