import { Wallet } from '../entities/wallet.entity';

export interface IWalletRepository {
    create(wallet: Wallet): Promise<void>;
    update(wallet: Wallet): Promise<void>;
    findAllForUser(userId: string): Promise<Wallet[]>;
    findUserWalletByName(userId: string, name: string): Promise<Wallet | null>;
    /**
     * `forUpdate` bloqueia a linha da carteira até o fim da transação
     * (SELECT ... FOR UPDATE). Fora de uma transação, o bloqueio é ignorado.
     */
    findUserWalletById(
        userId: string,
        walletId: string,
        options?: { forUpdate?: boolean },
    ): Promise<Wallet | null>;
    deleteUserWallet(userId: string, walletId: string): Promise<void>;
}
