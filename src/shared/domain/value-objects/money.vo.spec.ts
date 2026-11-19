import { Money } from './money.vo';
import { MoneyValueCannotBeNegativeError } from '../errors/money-value-cannot-be-negative.error';
import { MoneyCannotHaveMoreThanTwoDecimalPlacesError } from '../errors/money-cannot-have-more-than-two-decimal-place.error';

describe('Money', () => {
    it('aceita no máximo duas casas decimais (RN14)', () => {
        expect(Money.fromAmount('10.55').amount).toBe('10.55');
        expect(() => Money.fromAmount('10.555')).toThrow(
            MoneyCannotHaveMoreThanTwoDecimalPlacesError,
        );
    });

    it('rejeita valores negativos (RN15)', () => {
        expect(() => Money.fromAmount('-1.00')).toThrow(
            MoneyValueCannotBeNegativeError,
        );
    });

    it('soma sem erro de ponto flutuante', () => {
        const total = Money.fromAmount('0.10').add(Money.fromAmount('0.20'));
        expect(total.amount).toBe('0.30');
    });

    it('subtração que resultaria em negativo é rejeitada', () => {
        expect(() =>
            Money.fromAmount('1.00').subtract(Money.fromAmount('1.01')),
        ).toThrow(MoneyValueCannotBeNegativeError);
    });

    it('converte de e para centavos', () => {
        expect(Money.fromAmount('12.34').toCents()).toBe(1234);
        expect(Money.fromCents(1234).amount).toBe('12.34');
    });
});
