import { ETransferStatus } from '@/finance/domain/enums/transfer-status.enum';

export type TransferFilters = {
    status?: ETransferStatus;
};
