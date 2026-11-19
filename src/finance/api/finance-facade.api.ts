import { Money } from '@/shared/domain/value-objects/money.vo';

export type WithdrawFromWalletInput = {
    userId: string;
    walletId: string;
    amount: Money;
    description: string;
    date: Date;
};

export type WithdrawFromWalletOutput = {
    transactionId: string;
};

export type DepositToWalletInput = {
    userId: string;
    walletId: string;
    amount: Money;
    description: string;
    date: Date;
};

export type DepositToWalletOutput = {
    transactionId: string;
};

export interface IFinanceFacade {
    withdrawFromWallet(
        input: WithdrawFromWalletInput,
    ): Promise<WithdrawFromWalletOutput>;
    depositToWallet(
        input: DepositToWalletInput,
    ): Promise<DepositToWalletOutput>;
    createBasicCategories(userId: string): Promise<void>;
    createSystemCategories(userId: string): Promise<void>;
}
