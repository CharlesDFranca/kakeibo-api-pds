import { Type } from 'class-transformer';
import {
    IsDate,
    IsIn,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';

export class CreateTransactionDto {
    @IsNumberString(
        { no_symbols: false },
        { message: 'amount must be a valid monetary value' },
    )
    amount!: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    @Type(() => Date)
    @IsDate()
    date!: Date;

    @IsIn([ETransactionType.INCOME, ETransactionType.EXPENSE])
    type!: ETransactionType;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    categoryId!: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    walletId!: string;
}
