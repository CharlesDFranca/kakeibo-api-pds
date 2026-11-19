import { FundsAllocationRegistry } from './funds-allocation.registry';
import { WalletDeletionPolicy } from './wallet-deletion.policy';
import { WalletHasAllocatedMoneyError } from '@/finance/domain/errors/wallet-has-allocated-money.error';
import type { IFundsAllocationSource } from '../contracts/funds-allocation.contract';

function source(wallet: boolean, transaction: boolean): IFundsAllocationSource & { calls: number } {
    const s = {
        calls: 0,
        isWalletAllocated: () => { s.calls++; return Promise.resolve(wallet); },
        isTransactionAllocated: () => { s.calls++; return Promise.resolve(transaction); },
    };
    return s;
}

describe('FundsAllocationRegistry', () => {
    it('sem fontes registradas, nada está alocado', async () => {
        const registry = new FundsAllocationRegistry();

        expect(await registry.isWalletAllocated('u', 'w')).toBe(false);
        expect(await registry.isTransactionAllocated('u', 't')).toBe(false);
    });

    it('basta uma fonte responder sim', async () => {
        const registry = new FundsAllocationRegistry();
        registry.register(source(false, false));
        registry.register(source(true, false));

        expect(await registry.isWalletAllocated('u', 'w')).toBe(true);
        expect(await registry.isTransactionAllocated('u', 't')).toBe(false);
    });

    it('registrar a mesma fonte duas vezes não a consulta duas vezes', async () => {
        const registry = new FundsAllocationRegistry();
        const s = source(false, false);
        registry.register(s);
        registry.register(s);

        await registry.isWalletAllocated('u', 'w');

        expect(s.calls).toBe(1);
    });
});

describe('WalletDeletionPolicy (via porta do Finance)', () => {
    it('bloqueia quando alguma fonte diz que a carteira tem dinheiro alocado', async () => {
        const registry = new FundsAllocationRegistry();
        registry.register(source(true, false));

        await expect(new WalletDeletionPolicy(registry).ensureCanDelete('u', 'w')).rejects.toThrow(
            WalletHasAllocatedMoneyError,
        );
    });

    it('libera quando nenhuma fonte reivindica a carteira', async () => {
        const registry = new FundsAllocationRegistry();
        registry.register(source(false, false));

        await new WalletDeletionPolicy(registry).ensureCanDelete('u', 'w');
    });
});
