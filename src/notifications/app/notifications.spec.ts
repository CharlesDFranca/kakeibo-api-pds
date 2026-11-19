import { SequentialIdGenerator } from '@/finance/testing/in-memory-finance';
import { GoalReachedEvent } from '@/planning/domain/events/goal-reached.event';
import {
    ENotificationType,
    Notification,
} from '../domain/entities/notification.entity';
import type { INotificationRepository } from '../domain/repositories/notification-repository.interface';
import {
    CreateNotificationUseCase,
    ListNotificationsUseCase,
    MarkNotificationAsReadUseCase,
} from './use-cases/notification-use-cases';
import { GoalReachedHandler } from './handlers/goal-reached.handler';
import { NotificationNotFoundError } from './errors/notification-not-found.error';

class InMemoryNotificationRepository implements INotificationRepository {
    items = new Map<string, Notification>();

    create(n: Notification) {
        this.items.set(n.id, n);
        return Promise.resolve();
    }
    update(n: Notification) {
        this.items.set(n.id, n);
        return Promise.resolve();
    }
    findAllForUser(userId: string, filters: { unreadOnly?: boolean } = {}) {
        return Promise.resolve(
            [...this.items.values()].filter(
                (n) =>
                    n.userId === userId && (!filters.unreadOnly || !n.isRead()),
            ),
        );
    }
    findUserNotificationById(userId: string, id: string) {
        const n = this.items.get(id);
        return Promise.resolve(n && n.userId === userId ? n : null);
    }
}

describe('Notificações (F10) – consumidor de eventos', () => {
    let repo: InMemoryNotificationRepository;
    let handler: GoalReachedHandler;
    let list: ListNotificationsUseCase;
    let mark: MarkNotificationAsReadUseCase;

    beforeEach(() => {
        repo = new InMemoryNotificationRepository();
        handler = new GoalReachedHandler(
            new CreateNotificationUseCase(new SequentialIdGenerator(), repo),
        );
        list = new ListNotificationsUseCase(repo);
        mark = new MarkNotificationAsReadUseCase(repo);
    });

    it('GoalReachedEvent gera uma notificação não lida para o dono da meta', async () => {
        await handler.handle(
            new GoalReachedEvent('g1', 'user-1', 'Viagem', '100.00'),
        );

        const [n] = await list.execute({ userId: 'user-1' });
        expect(n?.type).toBe(ENotificationType.GOAL_REACHED);
        expect(n?.message.includes('Viagem')).toBe(true);
        expect(n?.read).toBe(false);
        expect((await list.execute({ userId: 'user-2' })).length).toBe(0);
    });

    it('marcar como lida remove da listagem de não lidas', async () => {
        await handler.handle(
            new GoalReachedEvent('g1', 'user-1', 'Viagem', '100.00'),
        );
        const [n] = await list.execute({ userId: 'user-1' });

        await mark.execute({ userId: 'user-1', notificationId: n!.id });

        expect(
            (await list.execute({ userId: 'user-1', unreadOnly: true })).length,
        ).toBe(0);
        expect((await list.execute({ userId: 'user-1' }))[0]?.read).toBe(true);
    });

    it('não marca notificação inexistente ou de outro usuário', async () => {
        await handler.handle(
            new GoalReachedEvent('g1', 'user-1', 'Viagem', '100.00'),
        );
        const [n] = await list.execute({ userId: 'user-1' });

        await expect(
            mark.execute({ userId: 'user-2', notificationId: n!.id }),
        ).rejects.toThrow(NotificationNotFoundError);
    });
});
