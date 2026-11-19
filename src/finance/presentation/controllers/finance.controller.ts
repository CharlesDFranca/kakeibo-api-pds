import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { CurrentPlan } from '@/core/decorators/current-plan.decorator';
import { EPlan } from '@/shared/plans/plan.enum';
import { CurrentUserId } from '@/core/decorators/current-user-id.decorator';
import { GetFinanceDashboardUseCase } from '@/finance/app/use-cases/dashboard/get-finance-dashboard.usecase';
import {
    parseRangeEnd,
    parseRangeStart,
} from '@/shared/utils/date-range';
import { GetFinanceDashboardDto } from '../dtos/finance-dashboard.dto';

@Controller('finance')
export class FinanceController {
    constructor(
        private readonly getFinanceDashboardUseCase: GetFinanceDashboardUseCase,
    ) {}

    @Get('dashboard')
    @HttpCode(HttpStatus.OK)
    async getDashboard(
        @CurrentUserId() userId: string,
        @CurrentPlan() plan: EPlan,
        @Query() query: GetFinanceDashboardDto,
    ) {
        return this.getFinanceDashboardUseCase.execute({
            userId,
            plan,
            startDate: query.startDate
                ? parseRangeStart(query.startDate)
                : undefined,
            endDate: query.endDate ? parseRangeEnd(query.endDate) : undefined,
        });
    }
}
