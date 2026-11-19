import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './infra/database/database.module';
import { RedisModule } from './infra/redis/redis.module';
import { CORE_TOKENS } from './core.tokens';
import { NestEventBusService } from './infra/events/nest-event-bus.service';
import { NodeCryptoIDGeneratorService } from './infra/services/id-generator.service';

@Module({
    imports: [DatabaseModule, RedisModule, EventEmitterModule.forRoot()],
    providers: [
        {
            provide: CORE_TOKENS.ID_GENERATOR,
            useClass: NodeCryptoIDGeneratorService,
        },
        {
            provide: CORE_TOKENS.EVENT_BUS,
            useClass: NestEventBusService,
        },
    ],
    exports: [RedisModule, CORE_TOKENS.ID_GENERATOR, CORE_TOKENS.EVENT_BUS],
})
export class CoreModule {}
