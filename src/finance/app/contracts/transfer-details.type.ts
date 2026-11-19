import { ETransferStatus } from '../../domain/enums/transfer-status.enum';

export type TransferDetails = {
    id: string;
    amount: string;
    status: ETransferStatus;
    sourceWallet: {
        id: string;
        name: string;
    };
    destinationWallet: {
        id: string;
        name: string;
    };
    createdAt: Date;
    updatedAt: Date;
};
