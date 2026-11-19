import { IsNotEmpty, IsNumberString, IsUUID } from 'class-validator';

export class CreateTransferDto {
    @IsNumberString(
        { no_symbols: false },
        { message: 'amount must be a valid monetary value' },
    )
    @IsNotEmpty()
    amount!: string;

    @IsUUID()
    sourceWalletId!: string;

    @IsUUID()
    destinationWalletId!: string;
}
