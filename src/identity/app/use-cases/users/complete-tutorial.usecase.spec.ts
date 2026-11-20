import { CompleteTutorialUseCase } from './complete-tutorial.usecase';
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

describe('CompleteTutorialUseCase', () => {
    it('marca o tutorial como concluído e persiste', async () => {
        const user = makeUser();
        const updated: User[] = [];
        const repo = {
            findById: () => Promise.resolve(user),
            update: (u: User) => {
                updated.push(u);
                return Promise.resolve();
            },
        };

        expect(user.tutorialCompleted).toBe(false);
        const result = await new CompleteTutorialUseCase(repo as never).execute({ userId: 'u1' });

        expect(result.tutorialCompleted).toBe(true);
        expect(updated[0]?.tutorialCompleted).toBe(true);
    });

    it('falha quando o usuário não existe', async () => {
        const repo = { findById: () => Promise.resolve(null), update: () => Promise.resolve() };

        await expect(new CompleteTutorialUseCase(repo as never).execute({ userId: 'x' })).rejects.toThrow(UserNotFoundError);
    });
});
