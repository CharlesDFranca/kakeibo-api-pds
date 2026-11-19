import type { DomainEvent } from './domain-event';

/**
 * Barramento interno de eventos (seção 6.3.3 do documento).
 * Os contextos publicam eventos aqui sem conhecer os consumidores.
 * Eventos só devem ser publicados depois que a persistência foi confirmada.
 */
export interface IEventBus {
    publish(event: DomainEvent): void;
}
