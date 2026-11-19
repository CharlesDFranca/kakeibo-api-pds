import { Inject, Injectable } from '@nestjs/common';
import { IBaseUseCase } from '@/shared/app/contracts/base-usecase.contract';
import { FINANCE_TOKENS } from '@/finance/finance.tokens';
import type { ITransferQuery } from '../../contracts/transfer-query.interface';
import { TransferDetails } from '../../contracts/transfer-details.type';
import { TransferFilters } from '../../contracts/transfer-filters.type';

type ListTransfersInput = {
    userId: string;
    filters?: TransferFilters;
};

type ListTransfersOutput = TransferDetails[];

/** ECUS10 (passos 1–2): histórico de transferências do usuário. */
@Injectable()
export class ListTransfersUseCase implements IBaseUseCase<
    ListTransfersInput,
    ListTransfersOutput
> {
    constructor(
        @Inject(FINANCE_TOKENS.TRANSFER_QUERY)
        private readonly transferQuery: ITransferQuery,
    ) {}

    async execute(input: ListTransfersInput): Promise<ListTransfersOutput> {
        return this.transferQuery.findAllForUser(input.userId, input.filters);
    }
}
