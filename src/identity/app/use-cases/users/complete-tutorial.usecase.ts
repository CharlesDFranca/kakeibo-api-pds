import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import type { IUserRepository } from '@/identity/domain/repositories/user-repository.interface';
import { IDENTITY_TOKENS } from '@/identity/identity.token';
import { UserNotFoundError } from '../../errors/user-not-found.error';

type MarkTutorialSeenInput = { userId: string; tutorial: string };

type MarkTutorialSeenOutput = { seenTutorials: string[] };

/** Marca o tutorial de uma tela como visto. Idempotente. O registro fica no usuário, então vale em qualquer navegador. */
@Injectable()
export class MarkTutorialSeenUseCase implements IBaseUseCase<
    MarkTutorialSeenInput,
    MarkTutorialSeenOutput
> {
    constructor(
        @Inject(IDENTITY_TOKENS.USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(
        input: MarkTutorialSeenInput,
    ): Promise<MarkTutorialSeenOutput> {
        const user = await this.userRepository.findById(input.userId);

        if (!user) throw new UserNotFoundError();

        user.markTutorialSeen(input.tutorial);
        await this.userRepository.update(user);

        return { seenTutorials: user.seenTutorials };
    }
}
