import {
    ChangeUserPlanUseCase,
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
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { ChangePlanDto } from '../dto/change-plan.dto';

@Controller('users')
export class UsersController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly findUserByIdUseCase: FindUserByIdUseCase,
        private readonly changeUserPlanUseCase: ChangeUserPlanUseCase,
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
}
