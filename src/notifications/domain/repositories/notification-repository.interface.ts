import type { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
    create(notification: Notification): Promise<void>;
    update(notification: Notification): Promise<void>;
    findAllForUser(
        userId: string,
        filters?: { unreadOnly?: boolean },
    ): Promise<Notification[]>;
    findUserNotificationById(
        userId: string,
        id: string,
    ): Promise<Notification | null>;
}
