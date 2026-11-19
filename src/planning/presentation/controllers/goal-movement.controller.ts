import { CurrentUserId } from '@/core/decorators/current-user-id.decorator';

import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    Post,
} from '@nestjs/common';

import { DepositGoalUseCase } from '../../app/use-cases/goals/deposit-goal.usecase';
import { ReverseGoalDepositUseCase } from '../../app/use-cases/goals/reverse-goal-deposit.usecase';
import { DepositGoalDto } from '../dtos/deposit-goal.dto';
import { RequiresFeature } from '@/core/decorators/requires-feature.decorator';
import { EFeature } from '@/shared/plans/feature.enum';

@RequiresFeature(EFeature.GOALS)
@Controller('goals')
export class GoalMovementController {
    constructor(
        private readonly depositGoal: DepositGoalUseCase,
        private readonly reverseGoalDeposit: ReverseGoalDepositUseCase,
    ) {}

    @Post(':id/deposits')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUserId() userId: string,
        @Param('id') goalId: string,
        @Body() body: DepositGoalDto,
    ) {
        return this.depositGoal.execute({
            userId,
            goalId,
            walletId: body.walletId,
            amount: body.amount,
        });
    }

    @Post(':id/deposits/:depositId/revert')
    @HttpCode(HttpStatus.CREATED)
    async revert(
        @CurrentUserId() userId: string,
        @Param('id') goalId: string,
        @Param('depositId') depositId: string,
    ) {
        return this.reverseGoalDeposit.execute({
            userId,
            goalId,
            depositId,
        });
    }
}
