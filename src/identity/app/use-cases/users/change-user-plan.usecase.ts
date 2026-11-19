import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import type { IUserRepository } from '@/identity/domain/repositories/user-repository.interface';
import { IDENTITY_TOKENS } from '@/identity/identity.token';
import { EPlan } from '@/shared/plans/plan.enum';
import { UserNotFoundError } from '../../errors/user-not-found.error';

type ChangeUserPlanInput = {
    userId: string;
    plan: EPlan;
};

type ChangeUserPlanOutput = { plan: EPlan };

/**
 * Troca o plano do usuário. O documento não define cobrança: enquanto não
 * houver integração de pagamento, a troca é direta.
 * Rebaixar não apaga dados; só bloqueia as rotas do plano perdido.
 */
@Injectable()
export class ChangeUserPlanUseCase implements IBaseUseCase<
    ChangeUserPlanInput,
    ChangeUserPlanOutput
> {
    constructor(
        @Inject(IDENTITY_TOKENS.USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(input: ChangeUserPlanInput): Promise<ChangeUserPlanOutput> {
        const user = await this.userRepository.findById(input.userId);

        if (!user) throw new UserNotFoundError();

        user.changePlan(input.plan);
        await this.userRepository.update(user);

        return { plan: user.plan };
    }
}
