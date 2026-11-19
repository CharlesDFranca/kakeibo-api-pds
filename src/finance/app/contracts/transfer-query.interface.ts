import { TransferDetails } from './transfer-details.type';
import { TransferFilters } from './transfer-filters.type';

export interface ITransferQuery {
    findAllForUser(
        userId: string,
        filters?: TransferFilters,
    ): Promise<TransferDetails[]>;

    findUserTransferById(
        userId: string,
        transferId: string,
    ): Promise<TransferDetails | null>;
}
