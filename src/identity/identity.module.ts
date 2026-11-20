import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/identity/infra/entities/typeorm-user.entity';

import { AuthController } from './presentation/controllers/auth.controller';
import { UsersController } from './presentation/controllers/user.controller';

import { LoginUseCase } from './app/use-cases/auth/login.usecase';
import { LogoutUseCase } from './app/use-cases/auth/logout.usecase';
import { CreateUserUseCase } from './app/use-cases/users/create-user.usecase';
import { FindUserByIdUseCase } from './app/use-cases/users/find-user-by-id.usecase';
import { ChangeUserPlanUseCase } from './app/use-cases/users/change-user-plan.usecase';
<<<<<<< HEAD
import { MarkTutorialSeenUseCase } from './app/use-cases/users/mark-tutorial-seen.usecase';
import { ResetTutorialsUseCase } from './app/use-cases/users/reset-tutorials.usecase';
=======
import { CompleteTutorialUseCase } from './app/use-cases/users/complete-tutorial.usecase';
>>>>>>> 2b80e84bd9c98cbe154a3c87146c227be8c3320f

import { TypeOrmUserRepository } from './infra/repositories/typeorm-user.repository';
import { RedisSessionRepository } from './infra/repositories/redis-session.repository';

import { AuthContextService } from './app/services/auth-context.service';
import { IDENTITY_TOKENS } from './identity.token';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './presentation/guards/session.guard';
import { PlanGuard } from './presentation/guards/plan.guard';
import { BcryptPasswordHasher } from './infra/services/bcrypt-password-hasher.service';
import { CoreModule } from '@/core/core.module';
import { TypeOrmIdentityUnitOfWork } from './infra/database/typeorm-identity.uow';
import { FinanceModule } from '@/finance/finance.module';

@Module({
    imports: [
        CoreModule,
        FinanceModule,
        TypeOrmModule.forFeature([UserEntity]),
    ],
    controllers: [AuthController, UsersController],
    providers: [
        LoginUseCase,
        LogoutUseCase,
        CreateUserUseCase,
        FindUserByIdUseCase,
        ChangeUserPlanUseCase,
<<<<<<< HEAD
        MarkTutorialSeenUseCase,
        ResetTutorialsUseCase,
=======
        CompleteTutorialUseCase,
>>>>>>> 2b80e84bd9c98cbe154a3c87146c227be8c3320f

        AuthContextService,

        {
            provide: IDENTITY_TOKENS.USER_REPOSITORY,
            useClass: TypeOrmUserRepository,
        },
        {
            provide: IDENTITY_TOKENS.SESSION_REPOSITORY,
            useClass: RedisSessionRepository,
        },
        {
            provide: IDENTITY_TOKENS.PASSWORD_HASHER,
            useClass: BcryptPasswordHasher,
        },
        {
            provide: IDENTITY_TOKENS.UNIT_OF_WORK,
            useClass: TypeOrmIdentityUnitOfWork,
        },
        // A ordem importa: o PlanGuard usa o `request.auth` do SessionGuard.
        { provide: APP_GUARD, useClass: SessionGuard },
        { provide: APP_GUARD, useClass: PlanGuard },
    ],
    exports: [
        IDENTITY_TOKENS.USER_REPOSITORY,
        IDENTITY_TOKENS.SESSION_REPOSITORY,
        IDENTITY_TOKENS.PASSWORD_HASHER,
        AuthContextService,
    ],
})
export class IdentityModule {}
