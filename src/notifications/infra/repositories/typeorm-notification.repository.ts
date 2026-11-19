import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from '@/notifications/domain/entities/notification.entity';
import type { INotificationRepository } from '@/notifications/domain/repositories/notification-repository.interface';
import { NotificationEntity } from '../entities/typeorm-notification.entity';

const toDomain = (e: NotificationEntity): Notification =>
    new Notification(e.id, {
        userId: e.userId,
        type: e.type,
        title: e.title,
        message: e.message,
        readAt: e.readAt,
        createdAt: e.createdAt,
    });

const toPersistence = (n: Notification): NotificationEntity => {
    const e = new NotificationEntity();
    e.id = n.id;
    e.userId = n.userId;
    e.type = n.type;
    e.title = n.title;
    e.message = n.message;
    e.readAt = n.readAt;
    e.createdAt = n.createdAt;
    return e;
};

@Injectable()
export class TypeOrmNotificationRepository implements INotificationRepository {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly repository: Repository<NotificationEntity>,
    ) {}

    async create(notification: Notification): Promise<void> {
        await this.repository.save(toPersistence(notification));
    }

    async update(notification: Notification): Promise<void> {
        await this.repository.save(toPersistence(notification));
    }

    async findAllForUser(
        userId: string,
        filters: { unreadOnly?: boolean } = {},
    ): Promise<Notification[]> {
        const rows = await this.repository.find({
            where: {
                userId,
                ...(filters.unreadOnly ? { readAt: IsNull() } : {}),
            },
            order: { createdAt: 'DESC' },
        });

        return rows.map(toDomain);
    }

    async findUserNotificationById(
        userId: string,
        id: string,
    ): Promise<Notification | null> {
        const row = await this.repository.findOne({ where: { id, userId } });

        return row ? toDomain(row) : null;
    }
}
