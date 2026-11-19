import {
    InMemoryWalletRepository,
    makeWallet,
} from '../../testing/in-memory-finance';
import { lockUserWalletPair, lockUserWallets } from './wallet-locking';
import { WalletNotFoundError } from '../errors/wallet-not-found.error';

describe('lockUserWallets', () => {
    let repository: InMemoryWalletRepository;

    beforeEach(async () => {
        repository = new InMemoryWalletRepository();
        await repository.create(makeWallet('b', '10.00'));
        await repository.create(makeWallet('a', '20.00'));
    });

    it('bloqueia sempre em ordem crescente de id (evita deadlock)', async () => {
        await lockUserWallets(repository, 'user-1', ['b', 'a']);
        expect(repository.lockedIds).toEqual(['a', 'b']);

        repository.lockedIds.length = 0;

        await lockUserWallets(repository, 'user-1', ['a', 'b']);
        expect(repository.lockedIds).toEqual(['a', 'b']);
    });

    it('devolve as carteiras na ordem solicitada', async () => {
        const [first, second] = await lockUserWalletPair(
            repository,
            'user-1',
            'b',
            'a',
        );

        expect(first.id).toBe('b');
        expect(second.id).toBe('a');
    });

    it('lança erro quando uma carteira não existe ou é de outro usuário', async () => {
        await expect(
            lockUserWallets(repository, 'user-1', ['a', 'zzz']),
        ).rejects.toThrow(WalletNotFoundError);

        await expect(
            lockUserWallets(repository, 'outro-usuario', ['a']),
        ).rejects.toThrow(WalletNotFoundError);
    });
});
