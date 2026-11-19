import { Wallet } from '@/finance/domain/entities/wallet.entity';
import { IWalletRepository } from '@/finance/domain/repositories/wallet-repository.interface';
import { WalletNotFoundError } from '../errors/wallet-not-found.error';

/**
 * Carrega e bloqueia (SELECT ... FOR UPDATE) as carteiras informadas, sempre
 * em ordem crescente de id. A ordem fixa evita deadlock quando duas operações
 * concorrentes envolvem as mesmas carteiras em sentidos opostos (RN08 / RNF02).
 *
 * Retorna as carteiras na ordem solicitada. Deve ser chamada dentro de uma
 * transação (Unit of Work).
 */
export async function lockUserWallets(
    walletRepository: IWalletRepository,
    userId: string,
    walletIds: string[],
): Promise<Wallet[]> {
    const wallets = new Map<string, Wallet>();

    for (const walletId of [...new Set(walletIds)].sort()) {
        const wallet = await walletRepository.findUserWalletById(
            userId,
            walletId,
            { forUpdate: true },
        );

        if (!wallet) throw new WalletNotFoundError();

        wallets.set(walletId, wallet);
    }

    // Devolve as carteiras na mesma ordem em que foram solicitadas.
    return walletIds.map((walletId) => {
        const wallet = wallets.get(walletId);

        if (!wallet) throw new WalletNotFoundError();

        return wallet;
    });
}

/** Variante para operações entre duas carteiras (transferência e estorno). */
export async function lockUserWalletPair(
    walletRepository: IWalletRepository,
    userId: string,
    firstWalletId: string,
    secondWalletId: string,
): Promise<[Wallet, Wallet]> {
    const [first, second] = await lockUserWallets(walletRepository, userId, [
        firstWalletId,
        secondWalletId,
    ]);

    if (!first || !second) throw new WalletNotFoundError();

    return [first, second];
}
