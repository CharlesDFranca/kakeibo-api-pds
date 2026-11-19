import { Injectable } from '@nestjs/common';
import type {
    IFundsAllocationRegistry,
    IFundsAllocationSource,
} from '../contracts/funds-allocation.contract';

/**
 * Composite das fontes de alocação. Sem nenhuma fonte registrada, nada
 * está alocado. Basta UMA fonte responder "sim" para bloquear.
 */
@Injectable()
export class FundsAllocationRegistry implements IFundsAllocationRegistry {
    private readonly sources: IFundsAllocationSource[] = [];

    register(source: IFundsAllocationSource): void {
        if (!this.sources.includes(source)) this.sources.push(source);
    }

    async isWalletAllocated(
        userId: string,
        walletId: string,
    ): Promise<boolean> {
        const answers = await Promise.all(
            this.sources.map((s) => s.isWalletAllocated(userId, walletId)),
        );
        return answers.some(Boolean);
    }

    async isTransactionAllocated(
        userId: string,
        transactionId: string,
    ): Promise<boolean> {
        const answers = await Promise.all(
            this.sources.map((s) =>
                s.isTransactionAllocated(userId, transactionId),
            ),
        );
        return answers.some(Boolean);
    }
}
