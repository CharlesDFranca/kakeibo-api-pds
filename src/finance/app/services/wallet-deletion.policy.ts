import { Inject, Injectable } from '@nestjs/common';
import { IWalletDeletionPolicy } from '../../domain/services/wallet-deletion-policy.interface';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import { WalletHasAllocatedMoneyError } from '@/finance/domain/errors/wallet-has-allocated-money.error';
import type { IFundsAllocationSource } from '../contracts/funds-allocation.contract';

@Injectable()
export class WalletDeletionPolicy implements IWalletDeletionPolicy {
    constructor(
        @Inject(FINANCE_TOKENS.FUNDS_ALLOCATION)
        private readonly fundsAllocation: IFundsAllocationSource,
    ) {}

    async ensureCanDelete(userId: string, walletId: string): Promise<void> {
        const hasAllocatedMoney = await this.fundsAllocation.isWalletAllocated(
            userId,
            walletId,
        );

        if (hasAllocatedMoney) throw new WalletHasAllocatedMoneyError();
    }
}
