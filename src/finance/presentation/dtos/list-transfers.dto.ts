import { IsEnum, IsOptional } from 'class-validator';
import { ETransferStatus } from '@/finance/domain/enums/transfer-status.enum';

export class ListTransfersDto {
    @IsOptional()
    @IsEnum(ETransferStatus)
    status?: ETransferStatus;
}
