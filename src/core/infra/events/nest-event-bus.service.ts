import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IEventBus } from '@/shared/events/event-bus.contract';
import type { DomainEvent } from '@/shared/events/domain-event';

/**
 * Implementação do barramento sobre o EventEmitter do NestJS.
 * Falha em um consumidor nunca afeta quem publicou o evento.
 */
@Injectable()
export class NestEventBusService implements IEventBus {
    private readonly logger = new Logger(NestEventBusService.name);

    constructor(private readonly emitter: EventEmitter2) {}

    publish(event: DomainEvent): void {
        this.emitter.emitAsync(event.name, event).catch((error: unknown) => {
            this.logger.error(
                `Falha ao processar o evento ${event.name}`,
                error instanceof Error ? error.stack : String(error),
            );
        });
    }
}
