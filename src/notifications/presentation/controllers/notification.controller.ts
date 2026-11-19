import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { CurrentUserId } from '@/core/decorators/current-user-id.decorator';
import { RequiresFeature } from '@/core/decorators/requires-feature.decorator';
import { EFeature } from '@/shared/plans/feature.enum';
import {
    ListNotificationsUseCase,
    MarkNotificationAsReadUseCase,
} from '../../app/use-cases/notification-use-cases';

@RequiresFeature(EFeature.NOTIFICATIONS)
@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly listNotifications: ListNotificationsUseCase,
        private readonly markAsRead: MarkNotificationAsReadUseCase,
    ) {}

    @Get()
    async list(
        @CurrentUserId() userId: string,
        @Query('unread') unread?: string,
    ) {
        return this.listNotifications.execute({
            userId,
            unreadOnly: unread === 'true',
        });
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.NO_CONTENT)
    async read(@CurrentUserId() userId: string, @Param('id') id: string) {
        await this.markAsRead.execute({ userId, notificationId: id });
    }
}
