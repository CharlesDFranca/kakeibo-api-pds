import { DomainEvent } from '@/shared/events/domain-event';

export const GOAL_REACHED_EVENT = 'planning.goal.reached';

/** Publicado pelo contexto de Planejamento quando uma meta atinge o valor-alvo. */
export class GoalReachedEvent extends DomainEvent {
    constructor(
        public readonly goalId: string,
        public readonly userId: string,
        public readonly goalName: string,
        public readonly targetAmount: string,
    ) {
        super();
    }

    get name(): string {
        return GOAL_REACHED_EVENT;
    }
}
