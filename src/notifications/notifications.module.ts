import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '@/core/core.module';
import { NOTIFICATIONS_TOKENS } from './notifications.tokens';
import { NotificationEntity } from './infra/entities/typeorm-notification.entity';
import { TypeOrmNotificationRepository } from './infra/repositories/typeorm-notification.repository';
import {
    CreateNotificationUseCase,
    ListNotificationsUseCase,
    MarkNotificationAsReadUseCase,
} from './app/use-cases/notification-use-cases';
import { GoalReachedHandler } from './app/handlers/goal-reached.handler';
import { NotificationController } from './presentation/controllers/notification.controller';

/** Contexto consumidor de eventos (F10 – plano Pro). */
@Module({
    imports: [CoreModule, TypeOrmModule.forFeature([NotificationEntity])],
    controllers: [NotificationController],
    providers: [
        CreateNotificationUseCase,
        ListNotificationsUseCase,
        MarkNotificationAsReadUseCase,
        GoalReachedHandler,
        {
            provide: NOTIFICATIONS_TOKENS.NOTIFICATION_REPOSITORY,
            useClass: TypeOrmNotificationRepository,
        },
    ],
})
export class NotificationsModule {}
