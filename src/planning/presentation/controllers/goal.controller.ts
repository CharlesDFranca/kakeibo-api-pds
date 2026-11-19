import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateGoalUseCase } from '../../app/use-cases/goals/create-goal.usecase';
import { CancelGoalUseCase } from '../../app/use-cases/goals/cancel-goal.usecase';
import { ListGoalsUseCase } from '../../app/use-cases/goals/list-goals.usecase';
import { RenameGoalUseCase } from '../../app/use-cases/goals/rename-goal.usecase';
import { CurrentUserId } from '@/core/decorators/current-user-id.decorator';
import { FindGoalByIdUseCase } from '../../app/use-cases/goals/find-goal-by-id.usecase';
import { CreateGoalDto } from '../dtos/create-goal.dto';
import { RenameGoalDto } from '../dtos/rename-goal.dto';
import { ReactivateGoalDto } from '../dtos/reactivate-goal.dto';
import { ReactivateGoalUseCase } from '../../app/use-cases/goals/reactivate-goal.usecase';
import { RequiresFeature } from '@/core/decorators/requires-feature.decorator';
import { EFeature } from '@/shared/plans/feature.enum';

@RequiresFeature(EFeature.GOALS)
@Controller('goals')
export class GoalController {
    constructor(
        private readonly createGoalUseCase: CreateGoalUseCase,
        private readonly cancelGoalUseCase: CancelGoalUseCase,
        private readonly listGoalsUsecase: ListGoalsUseCase,
        private readonly renameGoalUseCase: RenameGoalUseCase,
        private readonly findGoalByIdUseCase: FindGoalByIdUseCase,
        private readonly reactivateGoalUseCase: ReactivateGoalUseCase,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@CurrentUserId() userId: string, @Body() body: CreateGoalDto) {
        return this.createGoalUseCase.execute({
            userId,
            name: body.name,
            targetAmount: body.targetAmount,
            deadline: new Date(body.deadline),
        });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.cancelGoalUseCase.execute({
            userId,
            goalId: id,
        });
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findById(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.findGoalByIdUseCase.execute({ userId, goalId: id });
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async list(@CurrentUserId() userId: string) {
        return this.listGoalsUsecase.execute({ userId });
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async rename(
        @CurrentUserId() userId: string,
        @Body() body: RenameGoalDto,
        @Param('id') id: string,
    ) {
        return this.renameGoalUseCase.execute({
            goalId: id,
            userId,
            name: body.name,
        });
    }

    @Post(':id/reactivate')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reactivate(
        @CurrentUserId() userId: string,
        @Param('id') id: string,
        @Body() body: ReactivateGoalDto,
    ) {
        return this.reactivateGoalUseCase.execute({
            userId,
            goalId: id,
            deadline: body.deadline,
        });
    }
}
