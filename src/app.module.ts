import { Module } from '@nestjs/common';

import { IdentityModule } from './identity/identity.module';
import { FinanceModule } from './finance/finance.module';
import { PlanningModule } from './planning/planning.module';
import { CoreModule } from './core/core.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './app.controller';

@Module({
    controllers: [HealthController],
    imports: [
        IdentityModule,
        FinanceModule,
        PlanningModule,
        NotificationsModule,
        CoreModule,
    ],
})
export class AppModule {}
