import type { DomainEvent } from './domain-event';
import type { IEventBus } from './event-bus.contract';

/** Barramento em memória, usado nos testes para inspecionar o que foi publicado. */
export class InMemoryEventBus implements IEventBus {
    public readonly published: DomainEvent[] = [];

    publish(event: DomainEvent): void {
        this.published.push(event);
    }
}
