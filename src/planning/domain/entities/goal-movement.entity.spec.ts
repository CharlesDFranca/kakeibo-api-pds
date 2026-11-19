import { Money } from '@/shared/domain/value-objects/money.vo';
import { GoalMovement } from './goal-movement.entity';
import { GoalMovementAmountMustBeGreaterThanZeroError } from '../errors/goal-movement-amount-must-be-greater-than-zero.error';

describe('GoalMovement – factories', () => {
    const now = new Date('2026-02-01T10:00:00Z');
    const data = { goalId: 'g1', walletId: 'w1', transactionId: 't1', amount: Money.fromAmount('75.50') };

    it('deposit cria um aporte', () => {
        const d = GoalMovement.deposit('m1', data, now);

        expect(d.isDeposit()).toBe(true);
        expect(d.isWithdraw()).toBe(false);
        expect(d.goalId).toBe('g1');
        expect(d.transactionId).toBe('t1');
        expect(d.revertedDepositId).toBeUndefined();
        expect(d.canRevert()).toBe(true);
    });

    it('deposit recusa valor zero', () => {
        expect(() => GoalMovement.deposit('m1', { ...data, amount: Money.fromAmount('0') }, now)).toThrow(
            GoalMovementAmountMustBeGreaterThanZeroError,
        );
    });

    it('reversalOf copia valor, meta e carteira e aponta para o aporte (RN13)', () => {
        const deposit = GoalMovement.deposit('m1', data, now);
        const reversal = GoalMovement.reversalOf(deposit, 'm2', 't2', now);

        expect(reversal.isWithdraw()).toBe(true);
        expect(reversal.revertedDepositId).toBe('m1');
        expect(reversal.goalId).toBe(deposit.goalId);
        expect(reversal.walletId).toBe(deposit.walletId);
        expect(reversal.amount.equals(deposit.amount)).toBe(true);
        expect(reversal.transactionId).toBe('t2');
        expect(reversal.canRevert()).toBe(false);
    });
});
