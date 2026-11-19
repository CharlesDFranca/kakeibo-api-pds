import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { CORE_TOKENS } from '@/core/core.tokens';
import type { IIDGenerator } from '@/core/app/contracts/id-generator.contract';
import { NOTIFICATIONS_TOKENS } from '@/notifications/notifications.tokens';
import type { INotificationRepository } from '@/notifications/domain/repositories/notification-repository.interface';
import {
    ENotificationType,
    Notification,
} from '@/notifications/domain/entities/notification.entity';
import { NotificationNotFoundError } from '../errors/notification-not-found.error';

export type NotificationOutput = {
    id: string;
    type: ENotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
};

const toOutput = (n: Notification): NotificationOutput => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.isRead(),
    createdAt: n.createdAt,
});

@Injectable()
export class CreateNotificationUseCase implements IBaseUseCase<
    { userId: string; type: ENotificationType; title: string; message: string },
    { id: string }
> {
    constructor(
        @Inject(CORE_TOKENS.ID_GENERATOR)
        private readonly idGenerator: IIDGenerator,
        @Inject(NOTIFICATIONS_TOKENS.NOTIFICATION_REPOSITORY)
        private readonly repository: INotificationRepository,
    ) {}

    async execute(input: {
        userId: string;
        type: ENotificationType;
        title: string;
        message: string;
    }): Promise<{ id: string }> {
        const notification = new Notification(this.idGenerator.generate(), {
            ...input,
            readAt: null,
            createdAt: new Date(),
        });

        await this.repository.create(notification);

        return { id: notification.id };
    }
}

@Injectable()
export class ListNotificationsUseCase implements IBaseUseCase<
    { userId: string; unreadOnly?: boolean },
    NotificationOutput[]
> {
    constructor(
        @Inject(NOTIFICATIONS_TOKENS.NOTIFICATION_REPOSITORY)
        private readonly repository: INotificationRepository,
    ) {}

    async execute(input: {
        userId: string;
        unreadOnly?: boolean;
    }): Promise<NotificationOutput[]> {
        const list = await this.repository.findAllForUser(input.userId, {
            unreadOnly: input.unreadOnly ?? false,
        });

        return list.map(toOutput);
    }
}

@Injectable()
export class MarkNotificationAsReadUseCase implements IBaseUseCase<
    { userId: string; notificationId: string },
    void
> {
    constructor(
        @Inject(NOTIFICATIONS_TOKENS.NOTIFICATION_REPOSITORY)
        private readonly repository: INotificationRepository,
    ) {}

    async execute(input: {
        userId: string;
        notificationId: string;
    }): Promise<void> {
        const notification = await this.repository.findUserNotificationById(
            input.userId,
            input.notificationId,
        );
        if (!notification) throw new NotificationNotFoundError();

        notification.markAsRead();
        await this.repository.update(notification);
    }
}
