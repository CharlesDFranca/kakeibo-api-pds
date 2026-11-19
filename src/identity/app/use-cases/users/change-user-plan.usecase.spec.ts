import { ChangeUserPlanUseCase } from './change-user-plan.usecase';
import { User } from '@/identity/domain/entities/user.entity';
import { Email } from '@/identity/domain/value-objects/email.vo';
import { Username } from '@/identity/domain/value-objects/username.vo';
import { Name } from '@/shared/domain/value-objects/name.vo';
import { EPlan } from '@/shared/plans/plan.enum';
import { UserNotFoundError } from '../../errors/user-not-found.error';

function makeUser(plan = EPlan.FREE) {
    const now = new Date();
    return new User(
        'u1',
        {
            name: new Name('Ana'),
            username: new Username('ana'),
            email: new Email('ana@example.com'),
            password: 'hash',
            plan,
        },
        now,
        now,
    );
}

function makeRepo(user?: User) {
    const updated: User[] = [];
    const repo = {
        findById: () => Promise.resolve(user ?? null),
        update: (u: User) => {
            updated.push(u);
            return Promise.resolve();
        },
    };
    return { repo, updated };
}

describe('ChangeUserPlanUseCase', () => {
    it('troca o plano e persiste', async () => {
        const user = makeUser();
        const { repo, updated } = makeRepo(user);

        const result = await new ChangeUserPlanUseCase(repo as never).execute({
            userId: 'u1',
            plan: EPlan.PRO,
        });

        expect(result.plan).toBe(EPlan.PRO);
        expect(updated[0]?.plan).toBe(EPlan.PRO);
    });

    it('permite rebaixar o plano', async () => {
        const { repo } = makeRepo(makeUser(EPlan.PRO));

        const result = await new ChangeUserPlanUseCase(repo as never).execute({
            userId: 'u1',
            plan: EPlan.FREE,
        });

        expect(result.plan).toBe(EPlan.FREE);
    });

    it('usuário inexistente gera erro', async () => {
        const { repo } = makeRepo(undefined);

        await expect(
            new ChangeUserPlanUseCase(repo as never).execute({
                userId: 'x',
                plan: EPlan.PLUS,
            }),
        ).rejects.toThrow(UserNotFoundError);
    });
});
