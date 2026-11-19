import { EGoalStatus } from '../../enums/goal-status.enum';
import { GoalState } from './goal-state';
import { InProgressGoalState } from './in-progress.state';
import { CompletedGoalState } from './completed.state';
import { ExpiredGoalState } from './expired.state';
import { CancelledGoalState } from './cancelled.state';

export { GoalState, type GoalContext } from './goal-state';

// Os estados não guardam dados: uma instância de cada basta (Flyweight).
const STATES: Record<EGoalStatus, GoalState> = {
    [EGoalStatus.IN_PROGRESS]: new InProgressGoalState(),
    [EGoalStatus.COMPLETED]: new CompletedGoalState(),
    [EGoalStatus.EXPIRED]: new ExpiredGoalState(),
    [EGoalStatus.CANCELLED]: new CancelledGoalState(),
};

/**
 * Traduz o valor persistido (`EGoalStatus`) para o objeto de estado.
 * O banco continua guardando só o enum; o estado é derivado dele.
 */
export function goalStateFor(status: EGoalStatus): GoalState {
    return STATES[status];
}
