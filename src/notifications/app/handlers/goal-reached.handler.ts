import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    GOAL_REACHED_EVENT,
    GoalReachedEvent,
} from '@/planning/domain/events/goal-reached.event';
import { ENotificationType } from '@/notifications/domain/entities/notification.entity';
import { CreateNotificationUseCase } from '../use-cases/notification-use-cases';

/** Consumidor de `planning.goal.reached` (Figura 29 do documento). */
@Injectable()
export class GoalReachedHandler {
    private readonly logger = new Logger(GoalReachedHandler.name);

    constructor(private readonly createNotification: CreateNotificationUseCase) {}

    @OnEvent(GOAL_REACHED_EVENT)
    async handle(event: GoalReachedEvent): Promise<void> {
        await this.createNotification.execute({
            userId: event.userId,
            type: ENotificationType.GOAL_REACHED,
            title: 'Meta atingida!',
            message: `Você atingiu a meta "${event.goalName}" (R$ ${event.targetAmount}).`,
        });

        this.logger.log(`Notificação criada para a meta ${event.goalId}`);
    }
}
