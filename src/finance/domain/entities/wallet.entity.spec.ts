import { Money } from '@/shared/domain/value-objects/money.vo';
import { makeWallet } from '../../testing/in-memory-finance';
import { InsufficientWalletBalanceError } from '../errors/insufficient-wallet-balance.error';

describe('Wallet', () => {
    it('deposita e saca atualizando o saldo (RN08)', () => {
        const wallet = makeWallet('w1', '100.00');

        wallet.deposit(Money.fromAmount('50.00'));
        wallet.withdraw(Money.fromAmount('30.00'));

        expect(wallet.balance.amount).toBe('120.00');
    });

    it('não permite sacar mais que o saldo (RN10 / RN15)', () => {
        const wallet = makeWallet('w2', '10.00');

        expect(wallet.canWithdraw(Money.fromAmount('10.01'))).toBe(false);
        expect(() => wallet.withdraw(Money.fromAmount('10.01'))).toThrow(
            InsufficientWalletBalanceError,
        );
        expect(wallet.balance.amount).toBe('10.00');
    });

    it('permite sacar exatamente o saldo', () => {
        const wallet = makeWallet('w3', '10.00');

        wallet.withdraw(Money.fromAmount('10.00'));

        expect(wallet.balance.amount).toBe('0.00');
    });
});
