import {
    ChangeUserPlanUseCase,
<<<<<<< HEAD
    MarkTutorialSeenUseCase,
    ResetTutorialsUseCase,
=======
    CompleteTutorialUseCase,
>>>>>>> 2b80e84bd9c98cbe154a3c87146c227be8c3320f
    CreateUserUseCase,
    FindUserByIdUseCase,
} from '@/identity/app/use-cases/users';
import { CurrentUserId } from '@/core/decorators/current-user-id.decorator';
import { Public } from '@/core/decorators/public-route.decorator';
import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Body,
    Get,
    Patch,
    Delete,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { MarkTutorialDto } from '../dto/mark-tutorial.dto';
import { ChangePlanDto } from '../dto/change-plan.dto';

@Controller('users')
export class UsersController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly findUserByIdUseCase: FindUserByIdUseCase,
        private readonly changeUserPlanUseCase: ChangeUserPlanUseCase,
<<<<<<< HEAD
        private readonly markTutorialSeenUseCase: MarkTutorialSeenUseCase,
        private readonly resetTutorialsUseCase: ResetTutorialsUseCase,
=======
        private readonly completeTutorialUseCase: CompleteTutorialUseCase,
>>>>>>> 2b80e84bd9c98cbe154a3c87146c227be8c3320f
    ) {}

    @Public()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() body: CreateUserDto): Promise<{ id: string }> {
        return this.createUserUseCase.execute({
            name: body.name,
            username: body.username,
            email: body.email,
            password: body.password,
        });
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    async findById(@CurrentUserId() id: string) {
        return this.findUserByIdUseCase.execute({ id });
    }

    @Patch('me/plan')
    @HttpCode(HttpStatus.OK)
    async changePlan(
        @CurrentUserId() userId: string,
        @Body() body: ChangePlanDto,
    ) {
        return this.changeUserPlanUseCase.execute({
            userId,
            plan: body.plan,
        });
    }

<<<<<<< HEAD
    /** Registra que o usuário já viu o tutorial de uma tela (vale em qualquer navegador). */
    @Patch('me/tutorials')
    @HttpCode(HttpStatus.OK)
    async markTutorialSeen(
        @CurrentUserId() userId: string,
        @Body() body: MarkTutorialDto,
    ) {
        return this.markTutorialSeenUseCase.execute({
            userId,
            tutorial: body.tutorial,
        });
    }

    /** Zera os tutoriais vistos: todos voltam a aparecer como na primeira visita. */
    @Delete('me/tutorials')
    @HttpCode(HttpStatus.OK)
    async resetTutorials(@CurrentUserId() userId: string) {
        return this.resetTutorialsUseCase.execute({ userId });
=======
    /** Registra que o usuário já passou pelo tutorial (vale em qualquer navegador). */
    @Patch('me/tutorial')
    @HttpCode(HttpStatus.OK)
    async completeTutorial(@CurrentUserId() userId: string) {
        return this.completeTutorialUseCase.execute({ userId });
>>>>>>> 2b80e84bd9c98cbe154a3c87146c227be8c3320f
    }
}
