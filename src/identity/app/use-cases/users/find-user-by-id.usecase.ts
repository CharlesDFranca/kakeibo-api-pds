import type { IUserRepository } from '@/identity/domain/repositories/user-repository.interface';
import { IDENTITY_TOKENS } from '@/identity/identity.token';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { Injectable, Inject } from '@nestjs/common';
import { EPlan } from '@/shared/plans/plan.enum';
import { EFeature } from '@/shared/plans/feature.enum';
import { featuresOf } from '@/shared/plans/plan-features';
import { UserNotFoundError } from '../../errors/user-not-found.error';

type FindUserByIdInput = {
    id: string;
};

type FindUserByIdOutput = {
    id: string;
    name: string;
    username: string;
    plan: EPlan;
    features: EFeature[];
};

@Injectable()
export class FindUserByIdUseCase implements IBaseUseCase<
    FindUserByIdInput,
    FindUserByIdOutput
> {
    constructor(
        @Inject(IDENTITY_TOKENS.USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(input: FindUserByIdInput): Promise<FindUserByIdOutput> {
        const user = await this.userRepository.findById(input.id);

        if (!user) throw new UserNotFoundError();

        return {
            id: user.id,
            name: user.name.value,
            username: user.username.value,
            plan: user.plan,
            features: featuresOf(user.plan),
        };
    }
}
