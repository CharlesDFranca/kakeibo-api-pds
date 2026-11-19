import { Money } from '@/shared/domain/value-objects/money.vo';
import { Transaction } from './transaction.entity';
import { TransactionType } from '../value-objects/transaction-type.vo';
import { ETransactionType } from '../enums/transaction-type.enum';
import { ETransactionDirection } from '../enums/transaction-direction.enum';
import { makeWallet } from '../../testing/in-memory-finance';
import { InsufficientWalletBalanceError } from '../errors/insufficient-wallet-balance.error';
import { TransactionCannotBeDeletedError } from '../errors/transaction-cannot-be-deleted.error';
import { TransactionTypeNotAllowedError } from '../errors/transaction-type-not-allowed.error';

function tx(type: ETransactionType, direction?: ETransactionDirection) {
    const now = new Date();
    return new Transaction(
        't1',
        {
            description: '',
            amount: Money.fromAmount('25.00'),
            type: new TransactionType(type),
            date: now,
            walletId: 'w1',
            categoryId: 'c1',
            direction,
        },
        now,
        now,
    );
}

describe('Transaction.calculateBalanceImpact (US18)', () => {
    it('receita e saldo inicial somam; despesa subtrai', () => {
        expect(tx(ETransactionType.INCOME).calculateBalanceImpact().effect).toBe('CREDIT');
        expect(tx(ETransactionType.OPENING_BALANCE).calculateBalanceImpact().effect).toBe('CREDIT');
        expect(tx(ETransactionType.EXPENSE).calculateBalanceImpact().effect).toBe('DEBIT');
    });

    it('transferência segue o sentido registrado', () => {
        const into = tx(ETransactionType.TRANSFER, ETransactionDirection.IN);
        const out = tx(ETransactionType.TRANSFER, ETransactionDirection.OUT);

        expect(into.calculateBalanceImpact().effect).toBe('CREDIT');
        expect(out.calculateBalanceImpact().effect).toBe('DEBIT');
    });

    it('transferência legada sem sentido e ajuste não têm efeito calculável', () => {
        expect(tx(ETransactionType.TRANSFER).calculateBalanceImpact().effect).toBe('NONE');
        expect(tx(ETransactionType.ADJUSTMENT).calculateBalanceImpact().effect).toBe('NONE');
    });

    it('só receita e despesa podem ser excluídas', () => {
        expect(tx(ETransactionType.INCOME).canBeDeleted()).toBe(true);
        expect(tx(ETransactionType.EXPENSE).canBeDeleted()).toBe(true);
        expect(tx(ETransactionType.TRANSFER, ETransactionDirection.IN).canBeDeleted()).toBe(false);
        expect(tx(ETransactionType.OPENING_BALANCE).canBeDeleted()).toBe(false);
    });
});

describe('Wallet – ajuste de saldo na exclusão (US18)', () => {
    it('excluir despesa devolve o valor; excluir receita retira', () => {
        const wallet = makeWallet('w1', '100.00');

        wallet.adjustBalanceForDeletionOf(tx(ETransactionType.EXPENSE));
        expect(wallet.balance.amount).toBe('125.00');

        wallet.adjustBalanceForDeletionOf(tx(ETransactionType.INCOME));
        expect(wallet.balance.amount).toBe('100.00');
    });

    it('validarAjusteSaldo recusa exclusão que deixaria o saldo negativo (RN15)', () => {
        const wallet = makeWallet('w1', '10.00');

        expect(() =>
            wallet.validateBalanceAdjustmentForDeletionOf(tx(ETransactionType.INCOME)),
        ).toThrow(InsufficientWalletBalanceError);
    });

    it('não ajusta saldo para movimentações sem efeito calculável', () => {
        const wallet = makeWallet('w1', '10.00');

        expect(() =>
            wallet.adjustBalanceForDeletionOf(tx(ETransactionType.ADJUSTMENT)),
        ).toThrow(TransactionCannotBeDeletedError);
    });
});

describe('Transaction – factories', () => {
    const now = new Date('2026-01-10T12:00:00Z');
    const amount = Money.fromAmount('40.00');
    const base = { walletId: 'w1', categoryId: 'c1', amount };

    it('register cria receita e despesa', () => {
        const income = Transaction.register(
            'a',
            { ...base, description: 'Salário', type: new TransactionType(ETransactionType.INCOME), date: now },
            now,
        );
        const expense = Transaction.register(
            'b',
            { ...base, description: '', type: new TransactionType(ETransactionType.EXPENSE), date: now },
            now,
        );

        expect(income.isIncome()).toBe(true);
        expect(expense.isExpense()).toBe(true);
        expect(income.direction).toBeUndefined();
    });

    it('register recusa tipos que o usuário não pode criar', () => {
        for (const type of [ETransactionType.TRANSFER, ETransactionType.OPENING_BALANCE, ETransactionType.ADJUSTMENT]) {
            expect(() =>
                Transaction.register('x', { ...base, description: '', type: new TransactionType(type), date: now }, now),
            ).toThrow(TransactionTypeNotAllowedError);
        }
    });

    it('openingBalance usa descrição e tipo próprios, na data informada', () => {
        const t = Transaction.openingBalance('o', base, now);

        expect(t.isOpeningBalance()).toBe(true);
        expect(t.description).toBe('Opening balance');
        expect(t.date.getTime()).toBe(now.getTime());
        expect(t.createdAt.getTime()).toBe(now.getTime());
    });

    it('openingBalance aceita saldo zero (carteira nova vazia)', () => {
        expect(() => Transaction.openingBalance('o', { ...base, amount: Money.fromAmount('0') }, now)).not.toThrow();
    });

    it('transferOut e transferIn definem o sentido e a descrição padrão', () => {
        const out = Transaction.transferOut('o', base, now);
        const into = Transaction.transferIn('i', base, now);

        expect(out.isTransfer()).toBe(true);
        expect(out.direction).toBe(ETransactionDirection.OUT);
        expect(into.direction).toBe(ETransactionDirection.IN);
        expect(out.description).toBe('Transfer');
        expect(out.calculateBalanceImpact().effect).toBe('DEBIT');
        expect(into.calculateBalanceImpact().effect).toBe('CREDIT');
    });

    it('transferLeg aceita descrição própria', () => {
        const t = Transaction.transferLeg('t', { ...base, description: 'Aporte na meta' }, ETransactionDirection.OUT, now);

        expect(t.description).toBe('Aporte na meta');
    });

    it('as factories continuam validando a invariante de valor zero', () => {
        expect(() => Transaction.transferOut('o', { ...base, amount: Money.fromAmount('0') }, now)).toThrow();
    });
});
