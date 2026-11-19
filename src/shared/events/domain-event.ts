/** Evento de domínio: algo relevante que já aconteceu em um contexto. */
export abstract class DomainEvent {
    public readonly occurredAt: Date;

    protected constructor(occurredAt: Date = new Date()) {
        this.occurredAt = occurredAt;
    }

    /** Nome usado como chave no barramento (ex.: "finance.transaction.created"). */
    abstract get name(): string;
}
