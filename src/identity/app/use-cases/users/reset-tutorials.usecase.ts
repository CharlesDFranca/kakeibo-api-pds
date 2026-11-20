import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import type { IUserRepository } from '@/identity/domain/repositories/user-repository.interface';
import { IDENTITY_TOKENS } from '@/identity/identity.token';
import { UserNotFoundError } from '../../errors/user-not-found.error';

type ResetTutorialsInput = { userId: string };

type ResetTutorialsOutput = { seenTutorials: string[] };

/** Zera os tutoriais vistos, para o usuário rever o app como na primeira vez. O registro fica no usuário, então vale em qualquer navegador. */
@Injectable()
export class ResetTutorialsUseCase implements IBaseUseCase<
    ResetTutorialsInput,
    ResetTutorialsOutput
> {
    constructor(
        @Inject(IDENTITY_TOKENS.USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(input: ResetTutorialsInput): Promise<ResetTutorialsOutput> {
        const user = await this.userRepository.findById(input.userId);

        if (!user) throw new UserNotFoundError();

        user.resetTutorials();
        await this.userRepository.update(user);

        return { seenTutorials: user.seenTutorials };
    }
}
