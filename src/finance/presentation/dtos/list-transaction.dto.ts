import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsEnum,
    IsOptional,
    IsUUID,
} from 'class-validator';

export class ListTransactionsDto {
    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        Array.isArray(value) ? value : [value],
    )
    @IsArray()
    @IsUUID('4', { each: true })
    categoryIds?: string[];

    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        Array.isArray(value) ? value : [value],
    )
    @IsArray()
    @IsUUID('4', { each: true })
    walletIds?: string[];

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsEnum(ETransactionType)
    type?: ETransactionType;
}
