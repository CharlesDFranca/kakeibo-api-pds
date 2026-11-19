import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import type { ITransferQuery } from '../../contracts/transfer-query.interface';
import { TransferDetails } from '../../contracts/transfer-details.type';
import { TransferNotFoundError } from '../../errors/transfer-not-found.error';

type FindTransferByIdInput = {
    userId: string;
    transferId: string;
};

type FindTransferByIdOutput = TransferDetails;

/** ECUS10 (passos 3–4): dados de uma transferência antes do estorno. */
@Injectable()
export class FindTransferByIdUseCase implements IBaseUseCase<
    FindTransferByIdInput,
    FindTransferByIdOutput
> {
    constructor(
        @Inject(FINANCE_TOKENS.TRANSFER_QUERY)
        private readonly transferQuery: ITransferQuery,
    ) {}

    async execute(
        input: FindTransferByIdInput,
    ): Promise<FindTransferByIdOutput> {
        const transfer = await this.transferQuery.findUserTransferById(
            input.userId,
            input.transferId,
        );

        if (!transfer) throw new TransferNotFoundError();

        return transfer;
    }
}
