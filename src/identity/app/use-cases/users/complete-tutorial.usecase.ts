import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import type { IUserRepository } from '@/identity/domain/repositories/user-repository.interface';
import { IDENTITY_TOKENS } from '@/identity/identity.token';
import { UserNotFoundError } from '../../errors/user-not-found.error';

type CompleteTutorialInput = { userId: string };

type CompleteTutorialOutput = { tutorialCompleted: boolean };

/**
 * Marca o tutorial como visto. É idempotente: chamar de novo não muda nada.
 * O registro fica no usuário, então vale em qualquer navegador ou aparelho.
 */
@Injectable()
export class CompleteTutorialUseCase implements IBaseUseCase<
    CompleteTutorialInput,
    CompleteTutorialOutput
> {
    constructor(
        @Inject(IDENTITY_TOKENS.USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(input: CompleteTutorialInput): Promise<CompleteTutorialOutput> {
        const user = await this.userRepository.findById(input.userId);

        if (!user) throw new UserNotFoundError();

        user.completeTutorial();
        await this.userRepository.update(user);

        return { tutorialCompleted: user.tutorialCompleted };
    }
}
