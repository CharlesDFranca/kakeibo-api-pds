import { MarkTutorialSeenUseCase } from './mark-tutorial-seen.usecase';
import { ResetTutorialsUseCase } from './reset-tutorials.usecase';
import { User } from '@/identity/domain/entities/user.entity';
import { Email } from '@/identity/domain/value-objects/email.vo';
import { Username } from '@/identity/domain/value-objects/username.vo';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { EPlan } from '@/shared/plans/plan.enum';
import { UserNotFoundError } from '../../errors/user-not-found.error';

function makeUser() {
    const now = new Date();
    return new User(
        'u1',
        {
            name: new Name('Ana'),
            username: new Username('ana'),
            email: new Email('ana@example.com'),
            password: 'hash',
            plan: EPlan.FREE,
        },
        now,
        now,
    );
}

function makeRepo(user: User | null) {
    return {
        findById: () => Promise.resolve(user),
        update: () => Promise.resolve(),
    };
}

describe('Tutoriais do usuário', () => {
    it('marca tutoriais como vistos sem duplicar', async () => {
        const user = makeUser();
        const useCase = new MarkTutorialSeenUseCase(makeRepo(user) as never);

        await useCase.execute({ userId: 'u1', tutorial: 'dashboard' });
        const result = await useCase.execute({ userId: 'u1', tutorial: 'dashboard' });
        await useCase.execute({ userId: 'u1', tutorial: 'wallets' });

        expect(result.seenTutorials).toEqual(['dashboard']);
        expect(user.seenTutorials).toEqual(['dashboard', 'wallets']);
    });

    it('zera todos os tutoriais vistos', async () => {
        const user = makeUser();
        user.markTutorialSeen('dashboard');

        const result = await new ResetTutorialsUseCase(makeRepo(user) as never).execute({ userId: 'u1' });

        expect(result.seenTutorials).toEqual([]);
    });

    it('falha quando o usuário não existe', async () => {
        const repo = makeRepo(null);

        await expect(new MarkTutorialSeenUseCase(repo as never).execute({ userId: 'x', tutorial: 'plans' })).rejects.toThrow(UserNotFoundError);
        await expect(new ResetTutorialsUseCase(repo as never).execute({ userId: 'x' })).rejects.toThrow(UserNotFoundError);
    });
});
