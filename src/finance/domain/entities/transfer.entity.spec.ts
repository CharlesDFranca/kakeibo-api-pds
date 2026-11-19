import { Money } from '@/shared/domain/value-objects/money.vo';
import { Transfer } from './transfer.entity';
import { ETransferStatus } from '../enums/transfer-status.enum';
import { CannotTransferToSameWalletError } from '../errors/cannot-transfer-to-same-wallet.error';
import { AmountMustBeGreaterThanZeroError } from '@/shared/domain/errors/amount-must-be-greater-than-zero.error';

function makeTransfer(
    overrides: { amount?: string; destination?: string } = {},
): Transfer {
    const now = new Date();
    return new Transfer(
        't1',
        {
            amount: Money.fromAmount(overrides.amount ?? '10.00'),
            sourceWalletId: 'w1',
            destinationWalletId: overrides.destination ?? 'w2',
            sourceTransactionId: 'tx1',
            destinationTransactionId: 'tx2',
            status: ETransferStatus.COMPLETED,
        },
        now,
        now,
    );
}

describe('Transfer', () => {
    it('rejeita carteira de origem igual à de destino', () => {
        expect(() => makeTransfer({ destination: 'w1' })).toThrow(
            CannotTransferToSameWalletError,
        );
    });

    it('rejeita valor zero', () => {
        expect(() => makeTransfer({ amount: '0.00' })).toThrow(
            AmountMustBeGreaterThanZeroError,
        );
    });

    it('só pode ser estornada uma vez (US10)', () => {
        const transfer = makeTransfer();

        expect(transfer.canRevert()).toBe(true);

        transfer.revert();

        expect(transfer.status).toBe(ETransferStatus.REVERTED);
        expect(transfer.canRevert()).toBe(false);
    });
});
